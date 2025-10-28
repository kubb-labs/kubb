import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    transformers: 'src/transformers/index.ts',
    hooks: 'src/hooks/index.ts',
    utils: 'src/utils/index.ts',
    fs: 'src/fs/index.ts',
    logger: 'src/logger.ts',
  },
  dts: true,
  format: ['esm', 'cjs'],
  platform: 'node',
  sourcemap: true,
  shims: true,
  exports: true,
  external: [/@kubb\/fabric-core/],
  noExternal: [/p-limit/, /find-up/, /camelcase/],
})
