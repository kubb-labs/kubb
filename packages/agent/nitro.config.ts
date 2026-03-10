import { cpSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'

const _require = createRequire(import.meta.url)

export default defineNitroConfig({
  srcDir: 'server',
  alias: {
    // @redocly/openapi-core uses an npm alias pointing 'ajv' to '@redocly/ajv'.
    // esbuild (used by Nitro) resolves based on the physical folder structure and
    // does not follow the alias in the lockfile/package.json metadata during bundling.
    // Explicitly mapping 'ajv' here ensures Nitro/esbuild finds the correct package.
    ajv: '@redocly/ajv',
  },
  hooks: {
    // The `ajv` alias above replaces the entry-point import in the bundle, so Nitro's
    // module tracer only traces sub-path imports (e.g. `ajv/dist/compile/codegen`)
    // and never copies the full package. However, `ajv-formats` is kept as an external
    // CJS module and does `require('ajv')` at runtime — which resolves via the
    // filesystem and fails because the package is incomplete.
    // Copy `@redocly/ajv` (the aliased package that is always present as a transitive
    // dep of `@redocly/openapi-core`) into the output as `ajv` so that `ajv-formats`
    // can resolve it at runtime in any environment, including Docker.
    compiled(nitro) {
      const ajvPkg = _require.resolve('@redocly/ajv/package.json')
      const src = dirname(ajvPkg)
      const dest = resolve(nitro.options.output.serverDir, 'node_modules/ajv')
      cpSync(src, dest, { recursive: true, force: true })
    },
  },
  storage: {
    kubb: {
      driver: 'fs',
      base: './.kubb/cache',
    },
  },
  debug: false,
  serveStatic: false,
  compatibilityDate: '2026-02-22',
  ignore: ['**/*.test.ts', '**/*.spec.ts'],
  nodeModulesDirs: [
    './node_modules', // Local modules
    '../../node_modules', // Root modules (in a monorepo)
  ],
  rollupConfig: {
    output: {
      // Polyfill CJS globals for bundled dependencies that reference __filename/__dirname
      // in the ESM output (.mjs). These are not defined in ES module scope by default.
      banner: `import urlNode from 'node:url'
import pathNode from 'node:path'
const __filename = urlNode.fileURLToPath(import.meta.url)
const __dirname = pathNode.dirname(__filename)`,
    },
  },
  routeRules: {
    '/**': {
      cors: false,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Expose-Headers': '*',
      },
    },
  },
})
