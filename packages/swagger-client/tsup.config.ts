import { optionsCJS, optionsESM } from '@kubb/tsup-config'

import { defineConfig } from 'tsup'

export default defineConfig([
  optionsCJS,
  optionsESM,
  {
    ...optionsCJS,
    entry: ['./client.ts'],
    name: 'client',
    banner: {},
  },
  {
    ...optionsESM,
    entry: ['./client.ts'],
    name: 'client',
    banner: {},
  },
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
