import { defineConfig, type UserConfig } from 'tsdown'

const entry = {
  index: 'src/index.ts',
  types: 'src/types.ts',
  'jsx-runtime': './src/jsx-runtime.ts',
  'jsx-dev-runtime': './src/jsx-dev-runtime.ts',
}

const shared: Partial<UserConfig> = {
  platform: 'node',
  sourcemap: true,
  shims: true,
  exports: true,
  fixedExtension: false,
  // `react` is no longer a runtime dependency, only `@types/react` for JSX types.
  // Keep it external so the dts bundler leaves `import type … from 'react'` alone.
  external: ['react'],
  outputOptions: {
    keepNames: true,
  },
  deps: {
    onlyBundle: false,
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
