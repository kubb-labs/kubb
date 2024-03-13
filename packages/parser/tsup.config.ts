import { optionsCJS, optionsESM } from '@kubb/tsup-config'

import { defineConfig } from 'tsup'

export default defineConfig([
  {
    ...optionsCJS,
    entry: {
      index: 'src/index.ts',
      factory: 'src/factory.ts',
    },
    noExternal: [/lodash.tonumber/],
  },
  {
    ...optionsESM,
    entry: {
      index: 'src/index.ts',
      factory: 'src/factory.ts',
    },
    noExternal: [/lodash.tonumber/],
  },
])
