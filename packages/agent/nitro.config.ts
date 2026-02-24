import os from 'node:os'
import path from 'node:path'

export default defineNitroConfig({
  srcDir: 'server',
  storage: {
    kubb: {
      driver: 'fs',
      base: path.join(os.homedir(), '.kubb', 'kv'),
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
