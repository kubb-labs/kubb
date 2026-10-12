import { defineConfig, type Rolldown, type UserConfig } from 'tsdown'

const entry = {
  index: 'src/index.ts',
  testing: 'src/testing.ts',
  z: 'src/z.ts',
}

// `index` imports the built `z` entry instead of inlining it. Bundled into `index.d.ts`, `z` would
// become a namespace, and a namespace cannot hold Zod's `export * from 'zod'`.
function externalZ(id: string): Rolldown.Plugin {
  return {
    name: 'kubb:external-z',
    resolveId(source, importer) {
      if (/[\\/]src[\\/]index(\.d)?\.ts$/.test(importer ?? '') && source === './z.ts') return { id, external: true }
    },
  }
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
    dts: true,
    plugins: [externalZ('./z.js')],
    ...shared,
  },
  {
    entry,
    format: 'cjs',
    dts: false,
    plugins: [externalZ('./z.cjs')],
    ...shared,
  },
])
