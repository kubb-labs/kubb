import { optionsCJS, optionsESM } from '@kubb/tsup-config'

import { defineConfig } from 'tsup'

export default defineConfig([
  { ...optionsCJS, dts: false },
  { ...optionsESM },
  {
    ...optionsCJS,
    dts: false,
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
