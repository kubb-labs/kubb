import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/*.ts'],
  dts: true,
  format: ['esm', 'cjs'],
  platform: 'node',
  sourcemap: true,
  shims: true,
  exports: true,
})
