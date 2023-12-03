import { optionsCJS, optionsESM } from '@kubb/tsup-config'

import { defineConfig } from 'tsup'

export default defineConfig([
  {
    ...optionsESM,
    entry: { 'jsx-runtime': './src/jsx-runtime.ts' },
    name: 'react',
  },
  {
    ...optionsCJS,
    entry: { 'jsx-runtime': './src/jsx-runtime.ts' },
    name: 'react',
  },
  optionsCJS,
  optionsESM,
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
      components: 'src/components/index.ts',
    },
  },
  {
    ...optionsESM,
    entry: {
      hooks: 'src/hooks/index.ts',
      components: 'src/components/index.ts',
    },
  },
])
