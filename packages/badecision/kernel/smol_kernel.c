// badecision "serious" kernel: the first N blocks of a llama-architecture model (SmolLM2-360M-Instruct) read straight
// from GGUF tensors (Q4_0 / Q4_1 / Q8_0 / F32), prefill only. Returns the hidden state of the last token, which the
// trained head in JS turns into yes / no / maybe / unsure.
//
// Must match research/py/smol_ref.py (the reference the head was trained with): RMSNorm, llama.cpp "normal" RoPE on
// adjacent pairs, grouped-query causal attention, SwiGLU. A fixed prompt prefix is run once (sm_prefix) and its
// keys/values are kept, so each question only pays for its own tokens.
// Built with: node scripts/build.ts --kernel   (clang --target=wasm32 -msimd128, no libc)

#include <wasm_simd128.h>

typedef unsigned long size_t;
typedef unsigned char u8;
typedef unsigned short u16;
extern unsigned char __heap_base;

enum { T_F32 = 0, T_Q4_0 = 2, T_Q4_1 = 3, T_Q8_0 = 8 }; // ggml type ids
enum { NT = 9 };                                         // tensors per layer, in this order:
enum { ATTN_NORM, WQ, WK, WV, WO, FFN_NORM, WGATE, WUP, WDOWN };

static size_t heap;
static void *alloc(size_t n) {
  if (!heap) heap = (size_t)&__heap_base;
  heap = (heap + 15) & ~(size_t)15;
  void *p = (void *)heap;
  heap += n;
  size_t have = __builtin_wasm_memory_size(0) * 65536;
  if (heap > have && __builtin_wasm_memory_grow(0, (heap - have + 65535) / 65536) < 0) return 0;
  return p;
}
__attribute__((export_name("sm_alloc"))) void *sm_alloc(size_t n) { return alloc(n); }

static int DIM, NH, NKV, HD, FF, NL, MAXT, VOCAB;
static float EPS;
static const u8 *tw[64][NT]; // tensor pointers per layer
static int tt[64][NT];        // tensor types per layer
static const u8 *emb;
static int emb_type;
static float *rope;           // [MAXT][HD/2][2] cos, sin (filled by JS)
static float *kc, *vc;        // key/value cache [NL][MAXT][NKV*HD]
static float *x, *xn, *q, *att, *o, *g, *u, *acc;
static int *ids;
static int n_prefix;          // positions already in the cache

__attribute__((export_name("sm_init"))) int sm_init(int dim, int nh, int nkv, int ff, int nl, int maxt, int vocab, float eps) {
  DIM = dim, NH = nh, NKV = nkv, HD = dim / nh, FF = ff, NL = nl, MAXT = maxt, VOCAB = vocab, EPS = eps;
  int kvd = NKV * HD;
  rope = alloc(sizeof(float) * MAXT * HD);
  kc = alloc(sizeof(float) * (size_t)NL * MAXT * kvd);
  vc = alloc(sizeof(float) * (size_t)NL * MAXT * kvd);
  x = alloc(sizeof(float) * MAXT * DIM);
  xn = alloc(sizeof(float) * MAXT * DIM);
  q = alloc(sizeof(float) * MAXT * DIM);
  o = alloc(sizeof(float) * MAXT * DIM);
  att = alloc(sizeof(float) * MAXT);
  g = alloc(sizeof(float) * MAXT * FF);
  u = alloc(sizeof(float) * MAXT * FF);
  acc = alloc(sizeof(float) * MAXT);
  ids = alloc(sizeof(int) * MAXT);
  n_prefix = 0;
  return ids != 0;
}
__attribute__((export_name("sm_rope"))) float *sm_rope(void) { return rope; }
__attribute__((export_name("sm_ids"))) int *sm_ids(void) { return ids; }
__attribute__((export_name("sm_set_embedding"))) void sm_set_embedding(const u8 *p, int type) { emb = p, emb_type = type; }
__attribute__((export_name("sm_set_tensor"))) void sm_set_tensor(int layer, int which, const u8 *p, int type) { tw[layer][which] = p, tt[layer][which] = type; }

static inline float f16(const u8 *p) {
  u16 h = (u16)(p[0] | (p[1] << 8));
  unsigned s = (h & 0x8000u) << 16, e = (h >> 10) & 0x1f, m = h & 0x3ff;
  union { unsigned i; float f; } r;
  if (e == 0) { // subnormal or zero
    if (!m) { r.i = s; return r.f; }
    r.f = (float)m * (1.f / 16777216.f); // m * 2^-24
    r.i |= s;
    return r.f;
  }
  if (e == 31) { r.i = s | 0x7f800000u | (m << 13); return r.f; }
  r.i = s | ((e + 112) << 23) | (m << 13);
  return r.f;
}

// Dequantize one 32-weight block into w[32]; returns bytes consumed.
static inline int deq(const u8 *p, int type, float *w) {
  if (type == T_Q4_0) {
    float d = f16(p);
    for (int j = 0; j < 16; j++) { w[j] = ((p[2 + j] & 15) - 8) * d; w[j + 16] = ((p[2 + j] >> 4) - 8) * d; }
    return 18;
  }
  if (type == T_Q4_1) {
    float d = f16(p), m = f16(p + 2);
    for (int j = 0; j < 16; j++) { w[j] = (p[4 + j] & 15) * d + m; w[j + 16] = (p[4 + j] >> 4) * d + m; }
    return 20;
  }
  if (type == T_Q8_0) {
    float d = f16(p);
    for (int j = 0; j < 32; j++) w[j] = (signed char)p[2 + j] * d;
    return 34;
  }
  __builtin_memcpy(w, p, 128); // F32
  return 128;
}
static inline int row_bytes(int type, int n) {
  int b = n / 32;
  return type == T_Q4_0 ? b * 18 : type == T_Q4_1 ? b * 20 : type == T_Q8_0 ? b * 34 : n * 4;
}

// out[t][r] = sum_i W[r][i] * in[t][i] for t < T, rows r < R, W stored as GGUF rows of length C.
static void matmul(float *out, const float *in, const u8 *W, int type, int R, int C, int T) {
  float w[32] __attribute__((aligned(16)));
  int rb = row_bytes(type, C);
  for (int r = 0; r < R; r++) {
    const u8 *p = W + (size_t)r * rb;
    for (int t = 0; t < T; t++) acc[t] = 0;
    for (int c0 = 0; c0 < C; c0 += 32) {
      p += deq(p, type, w);
      v128_t w0 = wasm_v128_load(w), w1 = wasm_v128_load(w + 4), w2 = wasm_v128_load(w + 8), w3 = wasm_v128_load(w + 12);
      v128_t w4 = wasm_v128_load(w + 16), w5 = wasm_v128_load(w + 20), w6 = wasm_v128_load(w + 24), w7 = wasm_v128_load(w + 28);
      const float *xi = in + c0;
      for (int t = 0; t < T; t++, xi += C) {
        v128_t s = wasm_f32x4_mul(w0, wasm_v128_load(xi));
        s = wasm_f32x4_add(s, wasm_f32x4_mul(w1, wasm_v128_load(xi + 4)));
        s = wasm_f32x4_add(s, wasm_f32x4_mul(w2, wasm_v128_load(xi + 8)));
        s = wasm_f32x4_add(s, wasm_f32x4_mul(w3, wasm_v128_load(xi + 12)));
        s = wasm_f32x4_add(s, wasm_f32x4_mul(w4, wasm_v128_load(xi + 16)));
        s = wasm_f32x4_add(s, wasm_f32x4_mul(w5, wasm_v128_load(xi + 20)));
        s = wasm_f32x4_add(s, wasm_f32x4_mul(w6, wasm_v128_load(xi + 24)));
        s = wasm_f32x4_add(s, wasm_f32x4_mul(w7, wasm_v128_load(xi + 28)));
        acc[t] += wasm_f32x4_extract_lane(s, 0) + wasm_f32x4_extract_lane(s, 1) + wasm_f32x4_extract_lane(s, 2) + wasm_f32x4_extract_lane(s, 3);
      }
    }
    for (int t = 0; t < T; t++) out[(size_t)t * R + r] = acc[t];
  }
}

static float expf_(float z) {
  if (z > 88.f) z = 88.f;
  if (z < -88.f) z = -88.f;
  float kf = __builtin_floorf(z * 1.44269504f + 0.5f);
  float r = z - kf * 0.693359375f + kf * 2.12194440e-4f;
  float p = 1.f + r * (1.f + r * (0.5f + r * (1.f / 6 + r * (1.f / 24 + r * (1.f / 120 + r * (1.f / 720))))));
  union { float f; int i; } s = { .i = ((int)kf + 127) << 23 };
  return p * s.f;
}

static void rmsnorm(float *out, const float *in, const float *w, int T) {
  for (int t = 0; t < T; t++) {
    const float *a = in + (size_t)t * DIM;
    float ss = 0;
    for (int i = 0; i < DIM; i++) ss += a[i] * a[i];
    float s = 1.f / __builtin_sqrtf(ss / DIM + EPS);
    for (int i = 0; i < DIM; i++) out[(size_t)t * DIM + i] = a[i] * s * w[i];
  }
}

static void apply_rope(float *m, int heads, int T, int pos0) {
  for (int t = 0; t < T; t++) {
    const float *cs = rope + (size_t)(pos0 + t) * HD;
    for (int h = 0; h < heads; h++) {
      float *a = m + ((size_t)t * heads + h) * HD;
      for (int i = 0; i < HD / 2; i++) {
        float c = cs[2 * i], s = cs[2 * i + 1], a0 = a[2 * i], a1 = a[2 * i + 1];
        a[2 * i] = a0 * c - a1 * s;
        a[2 * i + 1] = a0 * s + a1 * c;
      }
    }
  }
}

// Run T new tokens (ids[0..T)) at positions n_prefix.., append their keys/values to the cache when keep != 0.
// Returns the hidden state of the last new token (DIM floats), or 0 if it would not fit.
static float *run(int T, int keep) {
  int P = n_prefix, kvd = NKV * HD, rep = NH / NKV;
  if (T < 1 || P + T > MAXT) return 0;
  float w[32] __attribute__((aligned(16)));
  for (int t = 0; t < T; t++) { // embedding rows
    const u8 *p = emb + (size_t)ids[t] * row_bytes(emb_type, DIM);
    for (int c0 = 0; c0 < DIM; c0 += 32) { p += deq(p, emb_type, w); __builtin_memcpy(x + (size_t)t * DIM + c0, w, 128); }
  }
  float scale = 1.f / __builtin_sqrtf((float)HD);
  for (int l = 0; l < NL; l++) {
    float *K = kc + (size_t)l * MAXT * kvd, *V = vc + (size_t)l * MAXT * kvd;
    rmsnorm(xn, x, (const float *)tw[l][ATTN_NORM], T);
    matmul(q, xn, tw[l][WQ], tt[l][WQ], DIM, DIM, T);
    matmul(K + (size_t)P * kvd, xn, tw[l][WK], tt[l][WK], kvd, DIM, T);
    matmul(V + (size_t)P * kvd, xn, tw[l][WV], tt[l][WV], kvd, DIM, T);
    apply_rope(q, NH, T, P);
    apply_rope(K + (size_t)P * kvd, NKV, T, P);
    for (int t = 0; t < T; t++) {
      int n = P + t + 1; // causal: prefix + new tokens up to t
      for (int h = 0; h < NH; h++) {
        const float *qh = q + ((size_t)t * NH + h) * HD;
        int kvh = h / rep;
        float mx = -1e30f;
        for (int s = 0; s < n; s++) {
          const float *kh = K + (size_t)s * kvd + kvh * HD;
          float d = 0;
          for (int i = 0; i < HD; i++) d += qh[i] * kh[i];
          att[s] = d * scale;
          if (att[s] > mx) mx = att[s];
        }
        float sum = 0;
        for (int s = 0; s < n; s++) { att[s] = expf_(att[s] - mx); sum += att[s]; }
        float *oh = o + ((size_t)t * NH + h) * HD;
        for (int i = 0; i < HD; i++) oh[i] = 0;
        for (int s = 0; s < n; s++) {
          const float *vh = V + (size_t)s * kvd + kvh * HD;
          float a = att[s] / sum;
          for (int i = 0; i < HD; i++) oh[i] += a * vh[i];
        }
      }
    }
    matmul(xn, o, tw[l][WO], tt[l][WO], DIM, DIM, T);
    for (size_t i = 0; i < (size_t)T * DIM; i++) x[i] += xn[i];
    rmsnorm(xn, x, (const float *)tw[l][FFN_NORM], T);
    matmul(g, xn, tw[l][WGATE], tt[l][WGATE], FF, DIM, T);
    matmul(u, xn, tw[l][WUP], tt[l][WUP], FF, DIM, T);
    for (size_t i = 0; i < (size_t)T * FF; i++) g[i] = g[i] / (1.f + expf_(-g[i])) * u[i];
    matmul(xn, g, tw[l][WDOWN], tt[l][WDOWN], DIM, FF, T);
    for (size_t i = 0; i < (size_t)T * DIM; i++) x[i] += xn[i];
  }
  if (keep) n_prefix += T;
  return x + (size_t)(T - 1) * DIM;
}

// The fixed prompt prefix: run once, keep its keys/values.
__attribute__((export_name("sm_prefix"))) int sm_prefix(int T) { n_prefix = 0; return run(T, 1) != 0; }
// A question's own tokens after the prefix; the cache is left as it was.
__attribute__((export_name("sm_forward"))) float *sm_forward(int T) { return run(T, 0); }
// A whole prompt from position 0 (for the rare question whose tokens merge into the prefix). Overwrites the cache:
// call sm_prefix again afterwards.
__attribute__((export_name("sm_full"))) float *sm_full(int T) { n_prefix = 0; return run(T, 0); }
