/** @typedef  {import("prettier").Config} PrettierConfig */

const moduleName = 'kubb'

/** @type { PrettierConfig & Record<string,unknown> } */
const config = {
  overrides: [
    {
      files: ['**/*.{js,mjs,cjs}'],
      options: {
        parser: 'meriyah',
      },
    },
  ],
  tabWidth: 2,
  useTabs: false,
  printWidth: 160,
  trailingComma: 'all',
  parser: 'typescript',
  singleQuote: true,
  semi: false,
  bracketSameLine: false,
  endOfLine: 'lf',
  plugins: ['@ianvs/prettier-plugin-sort-imports'],
  // `@ianvs/prettier-plugin-sort-imports` plugin's options
  importOrderParserPlugins: ['typescript', 'jsx', 'decorators-legacy'],
  importOrderTypeScriptVersion: '5.0.0',
  importOrder: [
    '^(react/(.*)$)|^(react$)',
    '<BUILTIN_MODULES>', // Node.js built-in modules
    '',
    `^@${moduleName}/(.*)$`,
    '',
    '<THIRD_PARTY_MODULES>', // Imports not matched by other special words or groups.
    '',
    '^~/(.*)$',
    '^[./]',
    '',
    '<TYPES>',
    '<TYPES>^[.]',
  ],
}

module.exports = config
