import { defineConfig } from 'tsup'

import { optionsCJS, optionsESM } from './src/index.ts'

export default defineConfig([optionsCJS, optionsESM])
