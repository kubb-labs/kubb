import { optionsCJS, optionsESM } from '@kubb/tsup-config'

import { defineConfig } from 'tsup'

export default defineConfig([
  optionsCJS,
  optionsESM,
  {
    ...optionsCJS,
    entry: ['src/client.ts'],
    name: 'client',
  },
  {
    ...optionsESM,
    entry: ['src/client.ts'],
    name: 'client',
  },
])
