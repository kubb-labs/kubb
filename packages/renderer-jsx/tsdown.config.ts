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
  outputOptions: {
    keepNames: true,
  },
  deps: {
    // `react` is type-only here (`@types/react` powers the JSX namespace) and never
    // ships in the runtime bundle. Keep it external so declaration generation leaves
    // the `import type … from 'react'` references alone instead of inlining `@types/react`.
    neverBundle: ['react'],
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
