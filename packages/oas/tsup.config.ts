import { optionsCJS, optionsESM } from '@kubb/config-tsup'

import { defineConfig } from 'tsup'

export default defineConfig([
  {
    ...optionsCJS,
    entry: {
      index: 'src/index.ts',
      parser: 'src/parser/index.ts',
      infer: 'src/infer/index.ts',
    },
    noExternal: [/whatwg-url/],
  },
  {
    ...optionsESM,
    entry: {
      index: 'src/index.ts',
      parser: 'src/parser/index.ts',
      infer: 'src/infer/index.ts',
    },
    noExternal: [/whatwg-url/],
  },
])
