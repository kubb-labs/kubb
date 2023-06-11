import { defineConfig } from 'tsup'

import { optionsCJS, optionsESM } from '../tsup-config/src'

export default defineConfig([
  optionsCJS,
  optionsESM,
  {
    ...optionsCJS,
    entry: ['src/flat.ts'],
    name: 'flat',
  },
  {
    ...optionsESM,
    entry: ['src/flat.ts'],
    name: 'flat',
  },
])
