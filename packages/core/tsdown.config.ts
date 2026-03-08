import { defineConfig, type UserConfig } from 'tsdown'

const entry = {
  index: 'src/index.ts',
  hooks: 'src/hooks/index.ts',
  fs: 'src/fs/index.ts',
  utils: 'src/utils/index.ts',
}

const shared: Partial<UserConfig> = {
  platform: 'node',
  sourcemap: true,
  shims: true,
  exports: true,
  deps: {
    neverBundle: [/^@kubb\/(?!utils)/],
    alwaysBundle: [/p-limit/, /@kubb\/utils/],
    onlyAllowBundle: false,
  },
  fixedExtension: false,
  outputOptions: {
    keepNames: true,
  },
}

export default defineConfig([
  {
    // ESM: generate dts here only to avoid two competing type chunks
    entry,
    format: 'esm',
    dts: true,
    ...shared,
  },
  {
    entry,
    format: 'cjs',
    dts: false,
    ...shared,
  },
])
