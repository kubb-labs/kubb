import { defineConfig, type UserConfig } from 'tsdown'

const entry = {
  index: 'src/index.ts',
}

const shared: Partial<UserConfig> = {
  platform: 'node',
  sourcemap: true,
  shims: true,
  deps: {
    neverBundle: [/^@kubb\//],
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
    // Also builds the CJS JavaScript. `keepNames` stays off the declaration passes: it leaks an untyped `__name` helper into .d.ts/.d.cts files.
    entry,
    format: ['esm', 'cjs'],
    ...shared,
    outputOptions: (options, format, { cjsDts }) => ({ ...options, keepNames: format === 'cjs' && !cjsDts }),
    dts: { emitDtsOnly: true, tsconfig: '../../tsconfig.dts.json' },
  },
])
