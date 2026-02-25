import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    mocks: 'src/mocks/index.ts',
    utils: 'src/utils/index.ts',
    generators: 'src/generators/index.ts',
    hooks: 'src/hooks/index.ts',
  },
  dts: true,
  format: ['esm', 'cjs'],
  platform: 'node',
  sourcemap: true,
  shims: true,
  exports: true,
  noExternal: [/p-limit/],
  external: [/^@kubb\//, '@types/react'],
  fixedExtension: false,
  outputOptions: {
    keepNames: true,
  },
})
