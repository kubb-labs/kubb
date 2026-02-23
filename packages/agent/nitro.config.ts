import { cpSync, existsSync, readdirSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'

export default defineNitroConfig({
  srcDir: 'server',
  debug: false,
  serveStatic: false,
  compatibilityDate: '2026-02-22',
  ignore: ['**/*.test.ts', '**/*.spec.ts'],
  rollupConfig: {
    output: {
      // Polyfill CJS globals for bundled dependencies that reference __filename/__dirname
      // in the ESM output (.mjs). These are not defined in ES module scope by default.
      banner: `import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)`,
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
  hooks: {
    compiled(nitro) {
      // Fix: Nitro's file tracer (@vercel/nft) only copies files reachable
      // via static imports. @kubb/* packages use dynamic resolution at runtime
      // (jiti-loaded templates, JSX components) so they need to be copied in full.
      const serverNodeModules = resolve(nitro.options.output.serverDir, 'node_modules')
      const rootNodeModules = resolve(nitro.options.rootDir, 'node_modules')

      function copyFullPackage(pkgPath: string) {
        const dest = resolve(serverNodeModules, pkgPath)
        const src = resolve(rootNodeModules, pkgPath)
        if (existsSync(src)) {
          rmSync(dest, { recursive: true, force: true })
          cpSync(src, dest, { recursive: true, dereference: true })
        }
      }

      // Copy all @kubb/* packages from source (not just those already in output)
      const kubbSrcDir = resolve(rootNodeModules, '@kubb')
      if (existsSync(kubbSrcDir)) {
        for (const pkg of readdirSync(kubbSrcDir)) {
          copyFullPackage(`@kubb/${pkg}`)
        }
      }
    },
  },
})
