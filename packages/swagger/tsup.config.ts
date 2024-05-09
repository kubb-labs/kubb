import { optionsCJS, optionsESM } from '@kubb/config-tsup'

import { defineConfig } from 'tsup'

export default defineConfig([
  {
    ...optionsCJS,
    entry: {
      index: 'src/index.ts',
      utils: 'src/utils.ts',
      components: 'src/components.ts',
      hooks: 'src/hooks.ts',
    },
  },
  {
    ...optionsESM,
    entry: {
      index: 'src/index.ts',
      utils: 'src/utils.ts',
      components: 'src/components.ts',
      hooks: 'src/hooks.ts',
    },
  },
])
