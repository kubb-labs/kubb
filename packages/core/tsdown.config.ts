import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    transformers: 'src/transformers/index.ts',
    hooks: 'src/hooks/index.ts',
    fs: 'src/fs/index.ts',
    utils: 'src/utils/index.ts',
  },
  dts: true,
  format: ['esm', 'cjs'],
  platform: 'node',
  sourcemap: true,
  shims: true,
  exports: true,
  external: [/^@kubb\//],
  noExternal: [/p-limit/],
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
