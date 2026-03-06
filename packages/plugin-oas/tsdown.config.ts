import { defineConfig, type UserConfig } from 'tsdown'

const entry = {
  index: 'src/index.ts',
  mocks: 'src/mocks/index.ts',
  utils: 'src/utils/index.ts',
  generators: 'src/generators/index.ts',
  hooks: 'src/hooks/index.ts',
}

const shared: Partial<UserConfig> = {
  platform: 'node',
  sourcemap: true,
  shims: true,
  exports: true,
  deps: {
    alwaysBundle: [/p-limit/],
    onlyAllowBundle: false,
    neverBundle: [/^@kubb\//, '@types/react'],
  },
  fixedExtension: false,
  outputOptions: {
    keepNames: true,
  },
}

export default defineConfig([
  {
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
