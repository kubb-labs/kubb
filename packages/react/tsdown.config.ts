import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    types: 'src/types.ts',
    devtools: 'src/devtools.ts',
    'jsx-runtime': './src/jsx-runtime.ts',
  },
  dts: true,
  format: ['esm', 'cjs'],
  platform: 'node',
  sourcemap: true,
  shims: true,
  exports: true,
  noExternal: [/react/],
})
