import { options, optionsCJS, optionsESM } from '@kubb/tsup-config'

import { defineConfig } from 'tsup'

export default defineConfig([
  optionsCJS,
  optionsESM,
  {
    ...options,
    entry: ['src/client.ts'],
    name: 'client',
    format: 'esm',
    dts: true,
    splitting: false,
  },
  {
    ...options,
    entry: ['src/index.ts'],
    name: 'client',
    format: 'cjs',
    dts: {
      compilerOptions: {
        target: 'ES5',
        module: 'commonjs',
        moduleResolution: 'node',
      },
    },
  },
])
