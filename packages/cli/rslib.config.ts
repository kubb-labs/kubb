import { options } from '@kubb/config-rslib'
import { defineConfig } from '@rslib/core'

export default defineConfig({
  ...options,
  source: {
    ...options.source,
    tsconfigPath: './tsconfig.build.json',
  },
})
