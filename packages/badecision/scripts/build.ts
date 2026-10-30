// Build the badecision package into dist/.
//   node scripts/build.ts                       # uses the committed kernel/bdm_kernel.wasm
//   node scripts/build.ts --kernel              # recompile the kernel first (needs clang with wasm32 + wasm-ld)
//   node scripts/build.ts --model ../../research/models/exp-distilled/model.bin
//   node scripts/build.ts --head ../core/models/serious/head.json     # the serious model's head (default shown)
//
// 1. vite: the JS, one file per module, with the @badecision/core files it uses in dist/core/ and the model, kernels
//    and head inlined as base64 into dist/generated/ (vite.config.ts)
// 2. tsc: type-check and the .d.ts files (src/ -> dist/, then the core files vite shipped -> dist/core/)
// 3. check dist/ is bundler-safe (no node: imports, no import.meta.url) and the kernel stays sync-compilable

import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import { config } from '../vite.config.ts';

const PKG = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CORE_PKG = resolve(PKG, '../core');
const args = process.argv.slice(2);
const flag = (name: string) => { const i = args.indexOf(name); return i < 0 ? undefined : (args[i + 1] ?? ''); };

const KERNEL = join(PKG, 'kernel/bdm_kernel.wasm');
const SMOL_KERNEL = join(PKG, 'kernel/smol_kernel.wasm');
const HEAD = resolve(flag('--head') ?? join(CORE_PKG, 'models/serious/head.json'));
const MODEL = resolve(flag('--model') ?? join(CORE_PKG, 'models/tiny/model.bin'));
const SYNC_COMPILE_LIMIT = 4096; // Chrome refuses synchronous WebAssembly.Module() above 4 KB on the main thread

if (args.includes('--kernel')) {
  execFileSync('clang', [
    '--target=wasm32', '-O3', '-msimd128', '-nostdlib', '-ffreestanding', '-Wall',
    '-Wl,--no-entry', '-Wl,--strip-all', '-o', KERNEL, join(PKG, 'kernel/bdm_kernel.c'),
  ], { stdio: 'inherit' });
  execFileSync('clang', [
    '--target=wasm32', '-O3', '-msimd128', '-nostdlib', '-ffreestanding', '-Wall',
    '-Wl,--no-entry', '-Wl,--strip-all', '-o', SMOL_KERNEL, join(PKG, 'kernel/smol_kernel.c'),
  ], { stdio: 'inherit' });
}

const kernel = readFileSync(KERNEL);
if (kernel.length > SYNC_COMPILE_LIMIT) throw new Error(`kernel is ${kernel.length} B, over the ${SYNC_COMPILE_LIMIT} B sync-compile limit`);
const model = readFileSync(MODEL);

const smolKernel = readFileSync(SMOL_KERNEL); // compiled asynchronously, so no size limit
const head = JSON.parse(readFileSync(HEAD, 'utf8'));

const bin = (name: string) => join(PKG, 'node_modules/.bin', name);
await build({ ...config({ model: MODEL, head: HEAD }), configFile: false, logLevel: 'warn' });
execFileSync(bin('tsc'), ['-p', join(PKG, 'tsconfig.json')], { stdio: 'inherit' });
// the core is plain JS: declarations for the files vite shipped, and the package's .d.ts files pointed at them
const core = readdirSync(join(PKG, 'dist/core')).map((f) => join(CORE_PKG, 'src', f));
execFileSync(bin('tsc'), [
  '--ignoreConfig', '--allowJs', '--declaration', '--emitDeclarationOnly', '--skipLibCheck', '--target', 'ES2022', '--module', 'NodeNext',
  '--rootDir', join(CORE_PKG, 'src'), '--outDir', join(PKG, 'dist/core'), ...core,
], { stdio: 'inherit' });

const walk = (d: string): string[] => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
const files = walk(join(PKG, 'dist'));
for (const f of files.filter((x) => x.endsWith('.d.ts'))) {
  const src = readFileSync(f, 'utf8');
  const fixed = src.replace(/(['"])@badecision\/core\/([\w-]+)\1/g, (_, q, name) => `${q}${relative(dirname(f), join(PKG, 'dist/core', name)).replace(/^(?!\.)/, './')}.js${q}`);
  if (fixed !== src) writeFileSync(f, fixed);
  if (/@badecision\/core/.test(fixed)) throw new Error(`${relative(PKG, f)} still imports @badecision/core`);
}
for (const f of files.filter((x) => x.endsWith('.js'))) {
  const src = readFileSync(f, 'utf8');
  if (/\bfrom\s*['"]node:|\bimport\(\s*['"]node:|\brequire\(/.test(src)) throw new Error(`${relative(PKG, f)} imports Node built-ins`);
  if (src.includes('import.meta.url')) throw new Error(`${relative(PKG, f)} uses import.meta.url`);
}

const kb = (n: number) => `${(n / 1024).toFixed(1)} KB`;
const total = files.reduce((s, f) => s + statSync(f).size, 0);
console.log(`badecision built: ${files.length} files, ${kb(total)} (model ${kb(model.length)} from ${relative(resolve(PKG, '../..'), MODEL)}, kernel ${kernel.length} B, serious kernel ${smolKernel.length} B, head ${head.hidden} hidden)`);
