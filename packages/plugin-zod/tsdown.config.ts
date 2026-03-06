import { defineConfig, type UserConfig } from 'tsdown'
import { importAttributeTextPlugin } from '../../configs/importAttributeTextPlugin.ts'

const entry = {
  index: 'src/index.ts',
  components: 'src/components/index.ts',
  generators: 'src/generators/index.ts',
  'templates/ToZod.source': 'src/templates/ToZod.source.ts',
}

const shared: Partial<UserConfig> = {
  plugins: [importAttributeTextPlugin()],
  platform: 'node',
  sourcemap: true,
  shims: true,
  exports: true,
  deps: {
    neverBundle: [/^@kubb\//],
  },
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
