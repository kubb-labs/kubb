import { options, optionsCJS, optionsESM } from '@kubb/config-rslib'
import { defineConfig } from '@rslib/core'

export default defineConfig({
  ...options,
  source: {
    ...options.source,
    exclude: [
      /\.test\.[jt]sx?$/,
      /\.spec\.[jt]sx?$/,
    ],
    entry: {
      index: 'src/**',
    }
  },
  lib: [
    optionsCJS,
    optionsESM,
  ],
})
