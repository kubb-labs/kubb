import { defineConfig, type UserConfig } from 'tsdown'

// One entry per `ast.*` namespace, so a package can extend a namespace with `export * from '@kubb/ast/<name>'`.
const entry = {
  index: 'src/index.ts',
  auth: 'src/auth/index.ts',
  factory: 'src/nodes/index.ts',
  file: 'src/file/index.ts',
  graph: 'src/graph/index.ts',
  http: 'src/http/index.ts',
  json: 'src/json/index.ts',
  macro: 'src/macro/index.ts',
  mediaType: 'src/mediaType/index.ts',
  node: 'src/node/index.ts',
  ref: 'src/ref/index.ts',
  schema: 'src/schema/index.ts',
  server: 'src/server/index.ts',
}

const shared: Partial<UserConfig> = {
  platform: 'node',
  sourcemap: true,
  shims: true,
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
    dts: { dtsOnly: true, tsconfig: '../../tsconfig.dts.json' },
  },
])
