import { defineConfig, type UserConfig } from 'tsdown'

const entry = {
  index: 'src/index.ts',
  testing: 'src/testing.ts',
}

// Entries that also ship as CommonJS. The test helpers import Vitest, which cannot be required, so they stay ESM-only.
const cjsEntry = {
  index: 'src/index.ts',
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
    dts: { emitDtsOnly: true, compilerOptions: { baseUrl: '../..' } },
  },
  {
    // Declarations get their own build: `keepNames` leaks an untyped `__name` helper into .d.ts files.
    entry,
    format: 'esm',
    ...shared,
    outputOptions: {},
    dts: { emitDtsOnly: true, compilerOptions: { baseUrl: '../..' } },
  },
])
