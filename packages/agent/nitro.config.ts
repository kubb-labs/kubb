import { cpSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'

const _require = createRequire(import.meta.url)

/**
 * Locate the `ajv` package directory using multiple resolution strategies.
 *
 * Background: @redocly/openapi-core declares `"ajv": "npm:@redocly/ajv"`, so esbuild
 * (via the `alias` option below) bundles @redocly/ajv instead of real ajv. Nitro's
 * module tracer sees the alias and only copies `ajv/package.json` to the output — not
 * the JS files. `ajv-formats` is kept as an external CJS module and calls
 * `require('ajv')` at runtime, which hits that incomplete stub and fails.
 *
 * The `compiled` hook copies the full package over the stub. We try several resolution
 * strategies because `import.meta.url` may point to a jiti-transpiled temp file in some
 * build environments (e.g. CI), making the top-level `_require` unable to find `ajv`.
 */
function resolveAjvSrc(): string {
  const strategies: Array<() => string> = [
    // 1. Standard: resolve from the nitro.config.ts file location
    () => dirname(_require.resolve('ajv/package.json')),
    // 2. Resolve from the package directory (process.cwd() = packages/agent/ during nitro build)
    () => dirname(createRequire(resolve(process.cwd(), 'package.json')).resolve('ajv/package.json')),
    // 3. Resolve from the monorepo root (pnpm workspace hoists ajv there)
    () => dirname(createRequire(resolve(process.cwd(), '../../package.json')).resolve('ajv/package.json')),
  ]

  for (const strategy of strategies) {
    try {
      const src = strategy()
      // Validate that this is a real, complete ajv installation
      if (existsSync(join(src, 'dist', 'ajv.js'))) {
        return src
      }
    } catch {}
  }

  throw new Error('[kubb-agent] Could not locate a valid ajv package (with dist/ajv.js). Ensure ajv@^8 is installed.')
}

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
    // module tracer only traces sub-path imports (e.g. `ajv/dist/compile`)
    // and never copies the full package. However, `ajv-formats` is kept as an external
    // CJS module and does `require('ajv')` at runtime — which resolves via the
    // filesystem and fails because the package is incomplete. Copy the full package
    // from the real `ajv` installation after the build to fix that.
    compiled(nitro) {
      const dest = resolve(nitro.options.output.serverDir, 'node_modules/ajv')
      const src = resolveAjvSrc()
      cpSync(src, dest, { recursive: true, force: true, dereference: true })
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
