import { optionsCJS, optionsESM } from '@kubb/tsup-config'

import { defineConfig } from 'tsup'

export default defineConfig([
  { ...optionsCJS, noExternal: [/react-reconcile/, /react/, /react\/jsx-runtime/] },
  { ...optionsESM, noExternal: [/react-reconcile/, /react/, /react\/jsx-runtime/] },
  {
    ...optionsCJS,
    entry: ['./client.ts'],
    name: 'client',
    banner: {},
  },
  {
    ...optionsESM,
    entry: ['./client.ts'],
    name: 'client',
    banner: {},
  },
])
