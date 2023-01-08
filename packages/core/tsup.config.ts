import { defineConfig } from 'tsup'

export default defineConfig(({ target }) => ({
  entry: ['src/index.ts'],
  treeshake: true,
  sourcemap: true,
  minify: false,
  splitting: false,
  clean: true,
  dts: true,
  /**
   * @link https://stackoverflow.com/questions/31931614/require-is-not-defined-node-js
   */
  banner: {
    js: target==="es5"? undefined: "import { createRequire } from 'module';const require = createRequire(import.meta.url);",
  },
  esbuildOptions: (options) => {
    if (target === 'es5') {
      options.alias = {
        fs: 'memfs',
        path: 'path-browserify',
        crypto: 'crypto-browserify',
      }
    }
  },
  shims: true,
  format: target==="es5"?['iife']: ['cjs', 'esm'],
}))
