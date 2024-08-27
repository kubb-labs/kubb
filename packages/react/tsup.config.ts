import { optionsCJS, optionsESM } from '@kubb/config-tsup'

import { defineConfig } from 'tsup'

export default defineConfig([
  {
    ...optionsCJS,
    entry: {
      index: 'src/index.ts',
      'jsx-runtime': './src/jsx-runtime.ts',
    },
    // noExternal: ['react', 'react-reconciler'],
  },
  {
    ...optionsESM,
    entry: {
      index: 'src/index.ts',
      'jsx-runtime': './src/jsx-runtime.ts',
    },
    // noExternal: ['react', 'react-reconciler'],
  },
])
