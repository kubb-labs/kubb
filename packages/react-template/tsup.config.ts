import { optionsCJS, optionsESM } from '@kubb/tsup-config'

import { defineConfig } from 'tsup'

export default defineConfig([
  { ...optionsCJS, noExternal: [/react-reconcile/, /react/, /react\/jsx-runtime/] },
  { ...optionsESM, noExternal: [/react-reconcile/, /react/, /react\/jsx-runtime/] },
])
