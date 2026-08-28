import { defineConfig, type UserConfig } from 'tsdown'

const entry = {
  index: 'src/index.ts',
  protocol: 'src/protocol/index.ts',
}

const shared: Partial<UserConfig> = {
  platform: 'node',
  sourcemap: true,
  shims: true,
  exports: true,
  deps: {
    // '@kubb/core/package.json' must be inlined: an externalized bare JSON import needs a
    // `with { type: 'json' }` attribute the emitted code does not carry, and Node refuses it.
    neverBundle: [/^@kubb\/(?!core\/package)/],
    alwaysBundle: [/@internals/, /^@kubb\/core\/package\.json$/],
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
