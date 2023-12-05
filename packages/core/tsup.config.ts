import { optionsCJS, optionsESM } from '@kubb/tsup-config'

import { defineConfig } from 'tsup'

export default defineConfig([
  {
    ...optionsCJS,
    entry: {
      index: 'src/index.ts',
      transformers: 'src/transformers/index.ts',
      utils: 'src/utils/index.ts',
      logger: 'src/logger.ts',
      fs: 'src/fs/index.ts',
    },
    noExternal: [/find-up/, /lodash.isequal/, /change-case/, /tinyrainbow/],
  },
  {
    ...optionsESM,
    entry: {
      index: 'src/index.ts',
      transformers: 'src/transformers/index.ts',
      utils: 'src/utils/index.ts',
      logger: 'src/logger.ts',
      fs: 'src/fs/index.ts',
    },
    noExternal: [/lodash.isequal/, /tinyrainbow/],
  },
  {
    ...optionsCJS,
    entry: ['./src/workers/!(*.test).ts'],
    outDir: 'dist/workers',
    dts: false,
    sourcemap: false,
    splitting: false,
    define: {
      'TYPE': JSON.stringify('cjs'),
    },
  },
  {
    ...optionsESM,
    entry: ['./src/*workers/!(*.test).ts'],
    outDir: 'dist/workers',
    dts: false,
    sourcemap: false,
    splitting: false,
    define: {
      'TYPE': JSON.stringify('esm'),
    },
  },
])
