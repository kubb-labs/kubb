import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  treeshake: false,
  sourcemap: false,
  minify: false,
  splitting: false,
  clean: true,
  dts: true,
  format: ['cjs', 'esm'],
})
