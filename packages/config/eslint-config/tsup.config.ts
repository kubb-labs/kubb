import { defineConfig } from 'tsup'

import { optionsCJS, optionsESM } from '../tsup-config/src/index.ts'

export default defineConfig([
  optionsCJS,
  optionsESM,
  {
    ...optionsCJS,
    entry: ['src/legacy.ts'],
    name: 'legacy',
  },
  {
    ...optionsESM,
    entry: ['src/legacy.ts'],
    name: 'legacy',
  },
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
