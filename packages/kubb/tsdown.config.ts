import { defineConfig, type UserConfig } from 'tsdown'

const entry = {
  index: 'src/index.ts',
  config: 'src/config.ts',
  kit: 'src/kit.ts',
  jsx: 'src/jsx.ts',
  'jsx/jsx-runtime': 'src/jsx/jsx-runtime.ts',
  'jsx/jsx-dev-runtime': 'src/jsx/jsx-dev-runtime.ts',
  astro: 'src/astro.ts',
  esbuild: 'src/esbuild.ts',
  farm: 'src/farm.ts',
  nuxt: 'src/nuxt.ts',
  rolldown: 'src/rolldown.ts',
  rollup: 'src/rollup.ts',
  rspack: 'src/rspack.ts',
  vite: 'src/vite.ts',
  webpack: 'src/webpack.ts',
}

// Entries that also ship as CommonJS. The bundler integrations re-export the ESM-only unplugin-kubb, so they stay ESM-only.
const cjsEntry = {
  index: 'src/index.ts',
  config: 'src/config.ts',
  kit: 'src/kit.ts',
  jsx: 'src/jsx.ts',
  'jsx/jsx-runtime': 'src/jsx/jsx-runtime.ts',
  'jsx/jsx-dev-runtime': 'src/jsx/jsx-dev-runtime.ts',
}

const shared: Partial<UserConfig> = {
  platform: 'node',
  sourcemap: true,
  shims: true,
  deps: {
    neverBundle: [/^@kubb\//],
    alwaysBundle: [/@internals/],
  },
  fixedExtension: false,
  outputOptions: {
    keepNames: true,
  },
}

export default defineConfig([
  {
    entry,
    format: 'esm',
    dts: false,
    ...shared,
  },
  {
    // Builds the CJS JavaScript and .d.cts files. `keepNames` stays off the declaration pass: it leaks an untyped `__name` helper into .d.cts files.
    entry: cjsEntry,
    format: 'cjs',
    ...shared,
    outputOptions: (options, _format, { cjsDts }) => ({ ...options, keepNames: !cjsDts }),
    dts: { emitDtsOnly: true, tsconfig: '../../tsconfig.dts.json' },
  },
  {
    // Declarations get their own build: `keepNames` leaks an untyped `__name` helper into .d.ts files.
    entry,
    format: 'esm',
    ...shared,
    outputOptions: {},
    dts: { emitDtsOnly: true, tsconfig: '../../tsconfig.dts.json' },
  },
])
