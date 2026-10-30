// BAdecision inference kernel: the numeric part of the tiny model's forward pass.
//   v      = mean(E[ids] * rowScale[ids])   int8 embedding bag
//   h      = act(U v + c)
//   logits = W h + b
// Tokenizing, hashing and softmax stay in JS (src/core/features.js, src/core/model.js); this file must give the
// same numbers as TinyModel.logits(). Built with: node scripts/build.ts --kernel  (clang --target=wasm32, no libc)

#define K 4 // yes, no, maybe, unsure

typedef unsigned long size_t;
extern unsigned char __heap_base;

static int B, D, H, ACT; // ACT: 0 = leaky relu, 1 = tanh, 2 = square
static float *row_scale, *U, *c, *W, *b, *v, *h, *out;
static signed char *E;
static int *ids, ids_cap;
static size_t heap;

static void *alloc(size_t n) {
  if (!heap) heap = (size_t)&__heap_base;
  heap = (heap + 15) & ~(size_t)15;
  void *p = (void *)heap;
  heap += n;
  size_t have = __builtin_wasm_memory_size(0) * 65536;
  if (heap > have) __builtin_wasm_memory_grow(0, (heap - have + 65535) / 65536);
  return p;
}

// exp without libm: 2^k * e^r, |r| <= ln2/2, degree-6 polynomial (rel. error < 2e-7)
static float expf_(float x) {
  if (x > 88.f) x = 88.f;
  if (x < -88.f) x = -88.f;
  float kf = __builtin_floorf(x * 1.44269504f + 0.5f);
  float r = x - kf * 0.693359375f + kf * 2.12194440e-4f;
  float p = 1.f + r * (1.f + r * (0.5f + r * (1.f / 6 + r * (1.f / 24 + r * (1.f / 120 + r * (1.f / 720))))));
  union { float f; int i; } s = { .i = ((int)kf + 127) << 23 };
  return p * s.f;
}

static float act(float z) {
  if (ACT == 1) return 1.f - 2.f / (expf_(2.f * z) + 1.f);
  if (ACT == 2) return z * z;
  return z > 0 ? z : 0.01f * z;
}

// Lay out memory for a model. JS then copies the weights to the pointers below.
__attribute__((export_name("bdm_init"))) void bdm_init(int buckets, int dim, int hidden, int activation) {
  B = buckets, D = dim, H = hidden, ACT = activation;
  row_scale = alloc(sizeof(float) * B);
  E = alloc((size_t)B * D);
  U = alloc(sizeof(float) * H * D);
  c = alloc(sizeof(float) * H);
  W = alloc(sizeof(float) * K * H);
  b = alloc(sizeof(float) * K);
  v = alloc(sizeof(float) * D);
  h = alloc(sizeof(float) * H);
  out = alloc(sizeof(float) * K);
}

__attribute__((export_name("bdm_row_scale"))) float *bdm_row_scale(void) { return row_scale; }
__attribute__((export_name("bdm_emb"))) signed char *bdm_emb(void) { return E; }
__attribute__((export_name("bdm_u"))) float *bdm_u(void) { return U; }
__attribute__((export_name("bdm_c"))) float *bdm_c(void) { return c; }
__attribute__((export_name("bdm_w"))) float *bdm_w(void) { return W; }
__attribute__((export_name("bdm_b"))) float *bdm_b(void) { return b; }

// A buffer for n feature ids (grows, never shrinks).
__attribute__((export_name("bdm_ids"))) int *bdm_ids(int n) {
  if (n > ids_cap) {
    ids_cap = n > 2 * ids_cap ? n : 2 * ids_cap;
    ids = alloc(sizeof(int) * ids_cap);
  }
  return ids;
}

// Forward pass over the first n ids. Returns a pointer to K float logits.
__attribute__((export_name("bdm_forward"))) float *bdm_forward(int n) {
  for (int d = 0; d < D; d++) v[d] = 0;
  for (int i = 0; i < n; i++) {
    int id = ids[i];
    float s = row_scale[id];
    signed char *e = E + (size_t)id * D;
    for (int d = 0; d < D; d++) v[d] += e[d] * s;
  }
  if (n) for (int d = 0; d < D; d++) v[d] /= n;
  for (int j = 0; j < H; j++) {
    float z = c[j];
    for (int d = 0; d < D; d++) z += U[j * D + d] * v[d];
    h[j] = act(z);
  }
  for (int k = 0; k < K; k++) {
    float z = b[k];
    for (int j = 0; j < H; j++) z += W[k * H + j] * h[j];
    out[k] = z;
  }
  return out;
}
