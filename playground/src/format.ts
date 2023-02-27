import { format as prettierFormat } from 'prettier'
import parserTypescript from 'prettier/parser-typescript'

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
export const format = (source: string) => {
  return prettierFormat(source, formatOptions)
}
