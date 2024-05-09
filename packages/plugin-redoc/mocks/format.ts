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
export function format(source?: string): Promise<string> {
  if (!source) {
    return Promise.resolve('')
  }
  return prettierFormat(source, formatOptions)
}
