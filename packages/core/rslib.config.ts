import { options, optionsCJS, optionsESM } from '@kubb/config-rslib'
import { defineConfig } from '@rslib/core'

export default defineConfig({
  ...options,
  source: {
    ...options.source,
    entry: {
      index: 'src/index.ts',
      transformers: 'src/transformers.ts',
      // utils: 'src/utils/index.ts',
      logger: 'src/logger.ts',
      // mocks: 'src/mocks/index.ts',
    },
    tsconfigPath: './tsconfig.build.json',
  },
  lib: [
    {
      ...optionsCJS,
      output: {
        externals: [/p-queue/, /find-up/, /camelcase/],
      },
    },
    optionsESM,
  ],
})
