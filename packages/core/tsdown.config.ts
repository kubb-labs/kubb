import { defineConfig, type UserConfig } from 'tsdown'

const entry = {
  index: 'src/index.ts',
  hooks: 'src/hooks/index.ts',
  mocks: 'src/mocks.ts',
}

const shared: Partial<UserConfig> = {
  platform: 'node',
  sourcemap: true,
  shims: true,
  exports: true,
  deps: {
    neverBundle: [/^@kubb\//],
    alwaysBundle: [/p-limit/, /@internals/],
    onlyBundle: false,
  },
  fixedExtension: false,
  outputOptions: {
    keepNames: true,
  },
}

export default defineConfig([
  {
    // ESM: generate dts here only to avoid two competing type chunks
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
