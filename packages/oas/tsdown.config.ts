import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
  },
  dts: true,
  format: ['esm', 'cjs'],
  platform: 'node',
  sourcemap: true,
  shims: true,
  exports: true,
  external: [/^@kubb\//],
  inlineOnly: false,
  fixedExtension: false,
  outExtensions({ format }) {
    if (format === 'cjs') return { dts: '.d.ts' }
    return {}
  },
  outputOptions: {
    keepNames: true,
  },
})
