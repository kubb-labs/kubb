import { optionsCJS, optionsESM } from '@kubb/tsup-config'

import { defineConfig } from 'tsup'

export default defineConfig([
  optionsCJS,
  optionsESM,
  {
    ...optionsCJS,
    entry: ['./engine.ts'],
    name: 'engine',
    banner: {},
  },
  {
    ...optionsESM,
    entry: ['./engine.ts'],
    name: 'engine',
    banner: {},
  },
])
