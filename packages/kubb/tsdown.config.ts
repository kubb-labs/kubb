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
  sourcemap: true,
  shims: true,
  exports: true,
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
    dts: true,
    ...shared,
  },
  {
    entry,
    format: 'cjs',
    dts: false,
    ...shared,
  },
])
