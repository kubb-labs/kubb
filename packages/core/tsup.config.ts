import { optionsCJS, optionsESM } from '@kubb/tsup-config'

import { defineConfig } from 'tsup'

export default defineConfig([
  {
    ...optionsCJS,
    entry: {
      index: 'src/index.ts',
      transformers: 'src/transformers/index.ts',
      utils: 'src/utils/index.ts',
      logger: 'src/logger.ts',
      fs: 'src/fs/index.ts',
    },
    noExternal: [/find-up/, /fs-extra/, /lodash.isequal/],
  },
  {
    ...optionsESM,
    entry: {
      index: 'src/index.ts',
      transformers: 'src/transformers/index.ts',
      utils: 'src/utils/index.ts',
      logger: 'src/logger.ts',
      fs: 'src/fs/index.ts',
    },
    noExternal: [/find-up/, /fs-extra/, /lodash.isequal/],
  },
])
