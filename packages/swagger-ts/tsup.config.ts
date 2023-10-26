import { optionsCJS, optionsESM } from '@kubb/tsup-config'

import { defineConfig } from 'tsup'

export default defineConfig([
  optionsCJS,
  optionsESM,
  {
    ...optionsCJS,
    entry: {
      hooks: 'src/hooks/index.ts',
    },
    name: 'hooks',
  },
  {
    ...optionsESM,
    entry: {
      hooks: 'src/hooks/index.ts',
    },
    name: 'hooks',
  },
])
