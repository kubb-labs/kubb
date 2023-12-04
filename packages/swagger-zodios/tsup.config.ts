import { optionsCJS, optionsESM } from '@kubb/tsup-config'

import { defineConfig } from 'tsup'

export default defineConfig([
  {
    ...optionsCJS,
    entry: {
      index: 'src/index.ts',
      components: 'src/components/index.ts',
    },
  },
  {
    ...optionsESM,
    entry: {
      index: 'src/index.ts',
      components: 'src/components/index.ts',
    },
  },
])
