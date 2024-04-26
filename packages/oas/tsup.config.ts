import { optionsCJS, optionsESM } from '@kubb/tsup-config'

import { defineConfig } from 'tsup'

export default defineConfig([
  {
    ...optionsCJS,
    entry: {
      index: 'src/index.ts',
      parser: 'src/parser/index.ts',
    },
  },
  {
    ...optionsESM,
    entry: {
      index: 'src/index.ts',
      parser: 'src/parser/index.ts',
    },
  },
])
