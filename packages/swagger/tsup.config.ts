import { optionsCJS, optionsESM } from '@kubb/tsup-config'

import { defineConfig } from 'tsup'

export default defineConfig([
  optionsCJS,
  optionsESM,
  {
    ...optionsCJS,
    entry: {
      utils: 'src/utils/index.ts',
    },
    name: 'utils',
  },
  {
    ...optionsESM,
    entry: {
      utils: 'src/utils/index.ts',
    },
    name: 'utils',
  },
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
  {
    ...optionsESM,
    entry: {
      infer: 'src/infer/index.ts',
    },
    name: 'infer',
  },
])
