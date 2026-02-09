import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    components: 'src/components/index.ts',
    generators: 'src/generators/index.ts',
    'clients/axios': 'src/clients/axios.ts',
    'clients/fetch': 'src/clients/fetch.ts',
  },
  dts: true,
  format: ['esm', 'cjs'],
  platform: 'node',
  sourcemap: true,
  shims: true,
  exports: false,
  external: [/^@kubb\//],
  fixedExtension: false,
  outputOptions: {
    keepNames: true,
  },
})
