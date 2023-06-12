/** @typedef  {import("prettier").Config} PrettierConfig */

const moduleName = 'kubb'

/** @type { PrettierConfig & Record<string,unknown> } */
const config = {
  tabWidth: 2,
  printWidth: 160,
  parser: 'typescript',
  singleQuote: true,
  semi: false,
  bracketSameLine: false,
  endOfLine: 'auto',
  plugins: ['@ianvs/prettier-plugin-sort-imports', 'prettier-plugin-curly'],
  // `@ianvs/prettier-plugin-sort-imports` plugin's options
  importOrderParserPlugins: ['typescript', 'jsx', 'decorators-legacy'],
  importOrderTypeScriptVersion: '5.1.3',
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
