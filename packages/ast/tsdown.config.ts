import { defineConfig, type UserConfig } from 'tsdown'

const entry = {
  index: 'src/index.ts',
  // Type-only subpath documented in the README (`@kubb/ast/types`). Lets consumers
  // import node interfaces and visitor types without pulling in any runtime.
  types: 'src/types.ts',
  // Spec-agnostic codegen string and identifier helpers (`@kubb/ast/utils`). Kept off the
  // main barrel so plugins can share them without depending on the AST node tree.
  utils: 'src/utils/index.ts',
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
