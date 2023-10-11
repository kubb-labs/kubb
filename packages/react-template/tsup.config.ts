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
    ...optionsCJS,
    // esbuildOptions: (options) => {
    //   options.alias = {
    //     ...options.alias,
    //     'react/jsx-runtime': '@kubb/react-template/jsx-runtime',
    //   }
    // },
  },
  {
    ...optionsESM,
    // esbuildOptions: (options) => {
    //   options.alias = {
    //     ...options.alias,
    //     'react/jsx-runtime': '@kubb/react-template/jsx-runtime',
    //   }
    // },
  },
])
