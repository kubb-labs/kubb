import { optionsCJS, optionsESM } from '@kubb/config-tsup'

import { defineConfig } from 'tsup'

export default defineConfig([
  {
    ...optionsCJS,
    entry: {
      index: 'src/index.ts',
      transformers: 'src/transformers/index.ts',
      utils: 'src/utils/index.ts',
      logger: 'src/logger.ts',
      mocks: 'mocks/index.ts',
    },
    noExternal: [/p-queue/, /find-up/, /natural-orderby/, /change-case/, /tinyrainbow/],
  },
  {
    ...optionsESM,
    entry: {
      index: 'src/index.ts',
      transformers: 'src/transformers/index.ts',
      utils: 'src/utils/index.ts',
      logger: 'src/logger.ts',
      mocks: 'mocks/index.ts',
    },
    noExternal: [/natural-orderby/, /tinyrainbow/],
  },
])
