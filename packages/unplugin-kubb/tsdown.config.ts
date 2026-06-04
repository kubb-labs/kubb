import { defineConfig, type UserConfig } from 'tsdown'

// `virtual.ts` is internal plumbing bundled into the factory; `./virtual` is reserved for the
// ambient `kubb:` module declarations shipped as `virtual.d.ts`.
const entry = ['src/*.ts', '!src/*.test.ts', '!src/virtual.ts']

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
  exports: {
    // `./virtual` ships only the ambient `kubb:` module declarations, so keep it after tsdown
    // regenerates the exports map from the build entries.
    customExports(exports: Record<string, unknown>) {
      exports['./virtual'] = { types: './virtual.d.ts' }
      return exports
    },
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
