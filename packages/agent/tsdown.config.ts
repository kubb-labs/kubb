import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    types: 'src/types.ts',
  },
  dts: true,
  format: ['esm', 'cjs'],
  platform: 'node',
  sourcemap: true,
  shims: true,
  exports: true,
  external: [/@kubb\/fabric-core/],
  fixedExtension: false,
  outputOptions: {
    keepNames: true,
  },
})
