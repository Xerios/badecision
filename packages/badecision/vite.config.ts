// The JS half of the build (scripts/build.ts runs it, then tsc for the .d.ts files).
// One output file per source module, so consumers' bundlers tree-shake per function and the test can import
// internals: src/*.ts -> dist/*.js, @badecision/core -> dist/core/*, inlined data -> dist/generated/*.

import { readFileSync, readdirSync, realpathSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import { defineConfig, type Plugin, type UserConfig } from 'vite';

const SRC = join(import.meta.dirname, 'src');
const CORE = realpathSync(join(import.meta.dirname, '../core'));
const DATA = /^(.*)\?(base64|head)$/;

/** Build-time overrides for the inlined data (scripts/build.ts --model, --head). */
export interface Overrides { model?: string; head?: string }

/**
 * Inlines data files when the code is built, so there are no generated sources (types: src/data.d.ts).
 *   import model from '.../model.bin?base64'     the file as a base64 string
 *   import head from '.../head.json?head'        the serious model's head: the fields serious.ts uses, checked
 */
function inline({ model, head }: Overrides): Plugin {
  const swap: Record<string, string | undefined> = {
    [join(CORE, 'models/tiny/model.bin')]: model,
    [join(CORE, 'models/serious/head.json')]: head,
  };
  return {
    name: 'badecision:inline',
    enforce: 'pre',
    async resolveId(source, importer) {
      const m = DATA.exec(source);
      if (!m) return;
      const r = await this.resolve(m[1], importer, { skipSelf: true });
      if (!r) this.error(`cannot resolve ${m[1]}`);
      return `${r.id}?${m[2]}`;
    },
    load(id) {
      const m = DATA.exec(id);
      if (!m) return;
      const file = swap[m[1]] ?? m[1];
      this.addWatchFile(file);
      if (m[2] === 'base64') return `export default ${JSON.stringify(readFileSync(file).toString('base64'))};`;
      const h = JSON.parse(readFileSync(file, 'utf8'));
      if (h.format !== 'badecision-head/1') this.error(`${file} is not a badecision head`);
      const { hidden, temperature, test, mu, sd, W1, b1, W2, b2 } = h;
      return `export default ${JSON.stringify({ hidden, temperature, test, mu, sd, W1, b1, W2, b2 })};`;
    },
  };
}

export const config = (overrides: Overrides = {}): UserConfig => ({
  root: import.meta.dirname,
  publicDir: false,
  plugins: [inline(overrides)],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2022',
    minify: false,
    lib: {
      // every module is an entry, so none of their exports get trimmed
      entry: Object.fromEntries(readdirSync(SRC).filter((f) => f.endsWith('.ts') && !f.endsWith('.d.ts')).map((f) => [basename(f, '.ts'), join(SRC, f)])),
      formats: ['es'],
    },
    rolldownOptions: {
      preserveEntrySignatures: 'strict',
      output: {
        preserveModules: true,
        entryFileNames: ({ facadeModuleId, moduleIds }) => {
          const id = facadeModuleId ?? moduleIds.at(-1) ?? '';
          const data = DATA.exec(id);
          const name = basename(data ? data[1] : id, extname(data ? data[1] : id));
          if (data) return `generated/${name}.js`;
          if (id.startsWith(CORE)) return `core/${name}.js`;
          return `${name}.js`;
        },
      },
    },
  },
});

export default defineConfig(config());
