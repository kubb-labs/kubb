import { defineConfig, type UserConfig } from 'tsdown'
import { importAttributeTextPlugin } from '../../configs/importAttributeTextPlugin.ts'

const entry = {
  index: 'src/index.ts',
  components: 'src/components/index.ts',
  generators: 'src/generators/index.ts',
  'clients/axios': 'src/clients/axios.ts',
  'clients/fetch': 'src/clients/fetch.ts',
  'templates/config.source': 'src/templates/config.source.ts',
  'templates/clients/axios.source': 'src/templates/clients/axios.source.ts',
  'templates/clients/fetch.source': 'src/templates/clients/fetch.source.ts',
}

const shared: Partial<UserConfig> = {
  plugins: [importAttributeTextPlugin()],
  platform: 'node',
  sourcemap: true,
  shims: true,
  exports: true,
  external: [/^@kubb\//],
  fixedExtension: false,
  outputOptions: {
    keepNames: true,
  },
}

export default defineConfig([
  {
    entry,
    format: 'esm',
    dts: true,
    ...shared,
  },
  {
    entry,
    format: 'cjs',
    dts: false,
    ...shared,
  },
])
