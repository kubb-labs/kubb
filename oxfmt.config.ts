import { defineConfig } from 'oxfmt'

export default defineConfig({
  printWidth: 160,
  tabWidth: 2,
  useTabs: false,
  trailingComma: 'all',
  semi: false,
  singleQuote: true,
  jsxSingleQuote: false,
  bracketSameLine: false,
  endOfLine: 'lf',
  ignorePatterns: [
    '**/__snapshots__/**',
    '**/schemas/**',
    '**/tests/e2e/schemas/**',
    '**/dist/**',
    '**/artifacts/**',
    '**/.next/**',
    '**/.output/**',
    '**/.nitro/**',
  ],
})
