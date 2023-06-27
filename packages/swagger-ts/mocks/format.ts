import { format as prettierFormat } from 'prettier'
import parserTypescript from 'prettier/parser-typescript.js'

import type { Options } from 'prettier'

const formatOptions: Options = {
  tabWidth: 2,
  printWidth: 160,
  parser: 'typescript',
  singleQuote: true,
  semi: false,
  bracketSameLine: false,
  endOfLine: 'auto',
  plugins: [parserTypescript],
}
export function format(source?: string) {
  if (!source) {
    return ''
  }
  return prettierFormat(source, formatOptions)
}
