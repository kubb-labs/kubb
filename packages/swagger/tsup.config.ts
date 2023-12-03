import { optionsCJS, optionsESM } from '@kubb/tsup-config'

import { defineConfig } from 'tsup'

export default defineConfig([
  optionsCJS,
  optionsESM,
  {
    ...optionsCJS,
    entry: {
      utils: 'src/utils/index.ts',
      hooks: 'src/hooks/index.ts',
    },
  },
  {
    ...optionsESM,
    entry: {
      utils: 'src/utils/index.ts',
      hooks: 'src/hooks/index.ts',
    },
  },
])
