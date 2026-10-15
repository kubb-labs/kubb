import { defineConfig, type UserConfig } from 'tsdown'

const entry = {
  index: 'src/index.ts',
  protocol: 'src/protocol.ts',
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
