import { defineConfig } from 'tsup'

import { optionsCJS, optionsESM } from './src/index'

export default defineConfig([optionsCJS, optionsESM])
