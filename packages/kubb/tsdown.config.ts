import { defineConfig, type UserConfig } from 'tsdown'

const entry = {
  index: 'src/index.ts',
  config: 'src/config.ts',
  kit: 'src/kit.ts',
  'kit/testing': 'src/kit/testing.ts',
  jsx: 'src/jsx.ts',
  'jsx/jsx-runtime': 'src/jsx/jsx-runtime.ts',
  'jsx/jsx-dev-runtime': 'src/jsx/jsx-dev-runtime.ts',
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
