import { defineConfig } from 'tsdown'
import { importAttributeTextPlugin } from '../../configs/importAttributeTextPlugin.ts'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    components: 'src/components/index.ts',
    generators: 'src/generators/index.ts',
    'templates/ToZod.source': 'src/templates/ToZod.source.ts',
  },
  plugins: [importAttributeTextPlugin()],
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
