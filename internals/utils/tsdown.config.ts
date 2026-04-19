import { defineConfig, type UserConfig } from 'tsdown'

const shared: Partial<UserConfig> = {
  platform: 'node',
  sourcemap: true,
  shims: true,
  exports: true,
  fixedExtension: false,
  deps: {
    neverBundle: [/^@kubb\//],
    alwaysBundle: [/@internals/],
  },
  outputOptions: {
    keepNames: true,
  },
}

export default defineConfig([
  {
    entry: { index: 'src/index.ts' },
    format: 'esm',
    dts: true,
    ...shared,
  },
  {
    entry: { index: 'src/index.ts' },
    format: 'cjs',
    dts: false,
    ...shared,
  },
])
