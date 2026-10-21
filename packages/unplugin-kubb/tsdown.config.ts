import { defineConfig, type UserConfig } from 'tsdown'

const entry = ['src/*.ts', '!src/*.test.ts']

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
    // Declarations get their own build: `keepNames` leaks an untyped `__name` helper into .d.ts files.
    entry,
    format: 'esm',
    ...shared,
    outputOptions: {},
    dts: { emitDtsOnly: true, tsconfig: '../../tsconfig.dts.json' },
  },
])
