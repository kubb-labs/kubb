import { optionsCJS, optionsESM } from '@kubb/config-tsup'

import { defineConfig } from 'tsup'

export default defineConfig([
  {
    ...optionsCJS,
    entry: {
      index: 'src/index.ts',
      'clients/axios': 'clients/axios.ts',
      'clients/fetch': 'clients/fetch.ts',
      components: 'src/components/index.ts',
      generators: 'src/generators/index.ts',
    },
  },
  {
    ...optionsESM,
    entry: {
      index: 'src/index.ts',
      'clients/axios': 'clients/axios.ts',
      'clients/fetch': 'clients/fetch.ts',
      components: 'src/components/index.ts',
      generators: 'src/generators/index.ts',
    },
  },
])
