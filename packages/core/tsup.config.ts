import { optionsCJS, optionsESM } from '@kubb/tsup-config'

import { defineConfig } from 'tsup'

export default defineConfig([
  {
    ...optionsCJS,
    noExternal: [/find-up/],
  },
  {
    ...optionsESM,
    noExternal: [/find-up/],
  },
  {
    ...optionsCJS,
    entry: {
      transformers: 'src/transformers/index.ts',
      utils: 'src/utils/index.ts',
      logger: 'src/logger.ts',
      fs: 'src/fs/index.ts',
    },
    noExternal: [/fs-extra/, /lodash.isequal/],
  },
  {
    ...optionsESM,
    entry: {
      transformers: 'src/transformers/index.ts',
      utils: 'src/utils/index.ts',
      logger: 'src/logger.ts',
      fs: 'src/fs/index.ts',
    },
    noExternal: [/fs-extra/, /lodash.isequal/],
  },
])
