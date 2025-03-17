import { format as prettierFormat } from 'prettier'
import pluginTypescript from 'prettier/plugins/typescript'

import type { Options } from 'prettier'

const formatOptions: Options = {
  tabWidth: 2,
  printWidth: 160,
  parser: 'typescript',
  singleQuote: true,
  semi: false,
  bracketSameLine: false,
  endOfLine: 'auto',
  plugins: [pluginTypescript],
}

/**
 * Format the generated code based on Prettier
 */
export async function format(source: string) {
  // do some basic linting with the ts compiler
  if (!source) {
    return ''
  }

  return prettierFormat(source, formatOptions)
}
