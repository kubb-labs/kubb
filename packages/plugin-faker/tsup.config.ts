import { optionsCJS, optionsESM } from '@kubb/config-tsup'

import { defineConfig } from 'tsup'

export default defineConfig([
  optionsCJS,
  optionsESM,
  {
    ...optionsCJS,
    entry: { components: './src/components/index.ts' },
    name: 'components',
    banner: {},
  },
  {
    ...optionsESM,
    entry: { components: './src/components/index.ts' },
    name: 'components',
    banner: {},
  },
])
