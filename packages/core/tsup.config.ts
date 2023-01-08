import { defineConfig } from 'tsup'

export default defineConfig([
  {
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
      js: "import { createRequire } from 'module';const require = createRequire(import.meta.url);",
    },
    shims: true,
    format: ['cjs', 'esm'],
  },
  {
    entry: ['src/index.ts'],
    treeshake: true,
    sourcemap: true,
    minify: false,
    splitting: false,
    clean: false,
    dts: false,
    esbuildOptions: (options) => {
      options.alias = {
        fs: 'memfs',
        'graceful-fs': 'memfs',
        Buffer: 'buffer',
        events: 'eventemitter3',
        path: 'path-browserify',
      }
    },
    shims: true,
    format: ['iife'],
  },
])
