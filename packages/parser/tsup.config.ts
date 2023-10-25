import { optionsCJS, optionsESM } from '@kubb/tsup-config'

import { defineConfig } from 'tsup'

export default defineConfig([optionsCJS, optionsESM, {
  ...optionsCJS,
  entry: ['src/factory.ts'],
  name: 'factory',
}, {
  ...optionsESM,
  entry: ['src/factory.ts'],
  name: 'factory',
}])
