import { optionsCJS, optionsESM } from '@kubb/config-tsup'

import { defineConfig } from 'tsup'

export default defineConfig([
  {
    ...optionsCJS,
    entry: {
      index: 'src/index.ts',
      transformers: 'src/transformers.ts',
      utils: 'src/utils/index.ts',
      logger: 'src/logger.ts',
      mocks: 'src/mocks/index.ts',
    },
  },
  {
    ...optionsESM,
    entry: {
      index: 'src/index.ts',
      transformers: 'src/transformers/index.ts',
      utils: 'src/utils/index.ts',
      logger: 'src/logger.ts',
      mocks: 'src/mocks/index.ts',
    },
    external: [/p-queue/, /find-up/, /camelcase/],
  },
])
