import { defineConfig } from 'tsdown'
import { importAttributeTextPlugin } from '../../configs/importAttributeTextPlugin.ts'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    components: 'src/components/index.ts',
    generators: 'src/generators/index.ts',
    'clients/axios': 'src/clients/axios.ts',
    'clients/fetch': 'src/clients/fetch.ts',
    'templates/config.source': 'src/templates/config.source.ts',
    'templates/clients/axios.source': 'src/templates/clients/axios.source.ts',
    'templates/clients/fetch.source': 'src/templates/clients/fetch.source.ts',
  },
  plugins: [importAttributeTextPlugin()],
  dts: true,
  format: ['esm', 'cjs'],
  platform: 'node',
  sourcemap: true,
  shims: true,
  exports: true,
  external: [/^@kubb\//],
  fixedExtension: false,
  outExtensions({ format }) {
    if (format === 'cjs') return { dts: '.d.ts' }
    return {}
  },
  outputOptions: {
    keepNames: true,
  },
})
