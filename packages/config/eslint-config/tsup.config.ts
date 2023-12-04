import { defineConfig } from 'tsup'

import { optionsCJS, optionsESM } from '@kubb/tsup-config'

export default defineConfig([
  {
    ...optionsCJS,
    entry: {
      index: 'src/index.ts',
      legacy: 'src/legacy.ts',
      flat: 'src/flat.ts',
    },
  },
  {
    ...optionsESM,
    entry: {
      index: 'src/index.ts',
      legacy: 'src/legacy.ts',
      flat: 'src/flat.ts',
    },
  },
])
