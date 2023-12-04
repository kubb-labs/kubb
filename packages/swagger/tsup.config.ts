import { optionsCJS, optionsESM } from '@kubb/tsup-config'

import { defineConfig } from 'tsup'

export default defineConfig([
  {
    ...optionsCJS,
    entry: {
      index: 'src/index.ts',
      utils: 'src/utils/index.ts',
      hooks: 'src/hooks/index.ts',
      oas: 'src/oas/index.ts',
    },
  },
  {
    ...optionsESM,
    entry: {
      index: 'src/index.ts',
      utils: 'src/utils/index.ts',
      hooks: 'src/hooks/index.ts',
      oas: 'src/oas/index.ts',
    },
  },
])
