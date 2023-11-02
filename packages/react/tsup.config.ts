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
  {
    ...optionsCJS,
    entry: {
      hooks: 'src/hooks/index.ts',
    },
    name: 'hooks',
  },
  {
    ...optionsESM,
    entry: {
      hooks: 'src/hooks/index.ts',
    },
    name: 'hooks',
  },
  {
    ...optionsCJS,
    entry: {
      components: 'src/components/index.ts',
    },
    name: 'components',
  },
  {
    ...optionsESM,
    entry: {
      components: 'src/components/index.ts',
    },
    name: 'components',
  },
])
