import { optionsCJS, optionsESM } from '@kubb/config-tsup'

import { defineConfig } from 'tsup'

export default defineConfig([
  optionsCJS,
  optionsESM,
  {
    ...optionsCJS,
    entry: { components: './src/components/index.ts', generators: 'src/generators/index.ts' },
  },
  {
    ...optionsESM,
    entry: { components: './src/components/index.ts', generators: 'src/generators/index.ts' },
  },
])
