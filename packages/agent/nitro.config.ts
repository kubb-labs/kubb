import { cpSync, existsSync, readdirSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'

export default defineNitroConfig({
  srcDir: 'server',
  debug: false,
  serveStatic: false,
  compatibilityDate: '2026-02-22',
  ignore: ['**/*.test.ts', '**/*.spec.ts'],
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
  // ajv and ajv-formats are inlined into the bundle to avoid pnpm resolving
  // ajv-formats' peer dep to @redocly/ajv (which lacks dist/ajv.js).
  externals: {
    inline: [/ajv/],
  },
  hooks: {
    compiled(nitro) {
      // Fix: Nitro's file tracer (@vercel/nft) only copies files reachable
      // via static imports. Packages that use dynamic resolution at runtime
      // (e.g. @kubb plugins loading templates via jiti, ajv-formats peer dep
      // on ajv resolved to @redocly/ajv by pnpm) end up with incomplete
      // file sets in the output. Replace them with the full packages.
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
