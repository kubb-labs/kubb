import { optionsCJS, optionsESM } from '@kubb/tsup-config'

import { defineConfig } from 'tsup'

export default defineConfig([
  {
    ...optionsCJS,
  },
  { ...optionsESM },
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
])
