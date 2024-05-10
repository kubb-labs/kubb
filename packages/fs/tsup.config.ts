import { optionsCJS, optionsESM } from '@kubb/config-tsup'

import { defineConfig } from 'tsup'

export default defineConfig([
  {
    ...optionsCJS,
    entry: {
      index: 'src/index.ts',
      types: 'src/types.ts',
    },
    noExternal: [/fs-extra/],
  },
  {
    ...optionsESM,
    entry: {
      index: 'src/index.ts',
      types: 'src/types.ts',
    },
    noExternal: [],
  },
])
