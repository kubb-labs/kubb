import { defineConfig, type UserConfig } from 'tsdown'

const entry = { index: 'src/index.ts', studioWorker: 'src/runners/studio/worker.ts' }

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
    entry: { index: 'src/index.ts' },
    format: 'cjs',
    dts: false,
    ...shared,
  },
  {
    // Declarations get their own build: `keepNames` leaks an untyped `__name` helper into .d.ts/.d.cts files.
    entry: { index: 'src/index.ts' },
    format: ['esm', 'cjs'],
    ...shared,
    outputOptions: {},
    dts: { emitDtsOnly: true, tsconfig: 'tsconfig.build.json' },
  },
])
