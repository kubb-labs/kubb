import { optionsCJS, optionsESM } from '@kubb/tsup-config'

import { defineConfig } from 'tsup'

export default defineConfig([
  {
    ...optionsCJS,
    entry: {
      index: 'src/index.ts',
      'jsx-runtime': './src/jsx-runtime.ts',
      client: 'src/client/index.ts',
      server: 'src/server/index.ts',
      hooks: 'src/hooks/index.ts',
      components: 'src/components/index.ts',
    },
  },
  {
    ...optionsESM,
    entry: {
      index: 'src/index.ts',
      'jsx-runtime': './src/jsx-runtime.ts',
      client: 'src/client/index.ts',
      server: 'src/server/index.ts',
      hooks: 'src/hooks/index.ts',
      components: 'src/components/index.ts',
    },
  },
])
