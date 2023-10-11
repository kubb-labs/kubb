import { optionsCJS, optionsESM } from '@kubb/tsup-config'

import { defineConfig } from 'tsup'

export default defineConfig([
  { ...optionsCJS },
  { ...optionsESM },
  {
    ...optionsCJS,
    entry: ['./src/jsx-runtime.ts'],
    outDir: 'dist/react',
    name: 'react',
    banner: {},
  },
  {
    ...optionsESM,
    entry: ['./src/jsx-runtime.ts'],
    outDir: 'dist/react',
    name: 'react',
    banner: {},
  },
])
