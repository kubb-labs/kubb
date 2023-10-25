import { optionsCJS, optionsESM } from '@kubb/tsup-config'

import { defineConfig } from 'tsup'

export default defineConfig([
  optionsCJS,
  optionsESM,
  {
    ...optionsESM,
    entry: ['./src/jsx-runtime.ts'],
    name: 'react',
    banner: {},
  },
  {
    ...optionsCJS,
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
    entry: ['./src/client/index.ts'],
    outDir: 'dist/client',
    name: 'client',
    banner: {},
  },
  {
    ...optionsESM,
    entry: ['./src/server/index.ts'],
    outDir: 'dist/server',
    name: 'server',
    banner: {},
  },
  {
    ...optionsCJS,
    entry: ['./src/server/index.ts'],
    outDir: 'dist/server',
    name: 'server',
    banner: {},
  },
])
