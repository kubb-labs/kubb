import { forceDefaultExport } from '@kubb/tsup-config'

import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entryPoints: ['src/*.ts'],
    clean: true,
    format: ['cjs', 'esm'],
    dts: true,
    async onSuccess() {
      await forceDefaultExport()
    },
  },
])
