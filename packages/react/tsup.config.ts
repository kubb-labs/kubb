import { optionsCJS, optionsESM } from '@kubb/config-tsup'

import { defineConfig } from 'tsup'

export default defineConfig([
  {
    ...optionsCJS,
    entry: {
      index: 'src/index.ts',
      'jsx-runtime': './src/jsx-runtime.ts',
      client: 'src/client/index.ts',
      server: 'src/server/index.ts',
    },
    external: ['prettier'],
  },
  {
    ...optionsESM,
    entry: {
      index: 'src/index.ts',
      'jsx-runtime': './src/jsx-runtime.ts',
      client: 'src/client/index.ts',
      server: 'src/server/index.ts',
    },
    external: ['prettier'],
  },
])
