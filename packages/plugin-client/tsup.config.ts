import { optionsCJS, optionsESM } from '@kubb/config-tsup'

import { defineConfig } from 'tsup'

export default defineConfig([
  {
    ...optionsCJS,
    entry: {
      index: 'src/index.ts',
      client: 'client.ts',
      components: 'src/components/index.ts',
      parsers: 'src/parsers/index.ts',
    },
  },
  {
    ...optionsESM,
    entry: {
      index: 'src/index.ts',
      client: 'client.ts',
      components: 'src/components/index.ts',
      parsers: 'src/parsers/index.ts',
    },
  },
])
