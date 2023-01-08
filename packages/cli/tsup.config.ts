import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  treeshake: true,
  sourcemap: false,
  minify: false,
  splitting: false,
  clean: true,
  dts: false,
  /**
   * @link https://stackoverflow.com/questions/31931614/require-is-not-defined-node-js
   */
  banner: {
    js: "import { createRequire } from 'module';const require = createRequire(import.meta.url);",
  },
  shims: true,
  format: ['cjs', 'esm'],
})
