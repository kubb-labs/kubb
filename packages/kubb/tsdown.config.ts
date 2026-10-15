import { defineConfig, type UserConfig } from 'tsdown'

const entry = {
  index: 'src/index.ts',
  config: 'src/config.ts',
  kit: 'src/kit.ts',
  'kit/testing': 'src/kit/testing.ts',
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

const shared: Partial<UserConfig> = {
  platform: 'node',
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
    entry,
    format: 'cjs',
    dts: false,
    ...shared,
  },
  {
    // Declarations get their own build: `keepNames` leaks an untyped `__name` helper into .d.ts/.d.cts files.
    entry,
    format: ['esm', 'cjs'],
    ...shared,
    outputOptions: {},
    dts: { emitDtsOnly: true, tsconfig: 'tsconfig.build.json' },
  },
])
