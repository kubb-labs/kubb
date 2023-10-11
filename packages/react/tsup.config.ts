import { optionsCJS, optionsESM } from '@kubb/tsup-config'

import { defineConfig } from 'tsup'

export default defineConfig([
  {
    ...optionsESM,
    entry: ['./src/jsx-runtime.ts'],
    name: 'react',
    banner: {},
  },
  {
    ...optionsCJS,
    dts: false,
    entry: ['./src/jsx-runtime.ts'],
    name: 'react',
    banner: {},
  },
  {
    ...optionsESM,
    entry: ['./src/client/index.ts'],
    outDir: 'dist/client',
    name: 'client',
    banner: {},
  },
  {
    ...optionsCJS,
    dts: false,
    entry: ['./src/client/index.ts'],
    outDir: 'dist/client',
    name: 'client',
    banner: {},
  },
  { ...optionsCJS, dts: false },
  {
    ...optionsESM,
  },
])
