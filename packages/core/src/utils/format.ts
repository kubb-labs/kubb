import { format as prettierFormat } from 'prettier'

import type { Options } from 'prettier'

const formatOptions: Options = {
  tabWidth: 2,
  printWidth: 160,
  parser: 'typescript',
  singleQuote: true,
  semi: false,
  bracketSameLine: false,
  endOfLine: 'auto',
}
export const format = (text: string) => {
  return prettierFormat(text, formatOptions)
}
