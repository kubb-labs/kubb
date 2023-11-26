import { optionsCJS, optionsESM } from '@kubb/tsup-config'

import { defineConfig } from 'tsup'

export default defineConfig([
  optionsCJS,
  optionsESM,
  {
    ...optionsCJS,
    entry: { components: './src/components/index.ts' },
    name: 'components',
  },
  {
    ...optionsESM,
    entry: { components: './src/components/index.ts' },
    name: 'components',
  },
  {
    ...optionsESM,
    entry: {
      infer: 'src/infer/index.ts',
    },
    name: 'infer',
  },
])
