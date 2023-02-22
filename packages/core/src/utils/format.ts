import beautify from 'js-beautify'

import type { JSBeautifyOptions } from 'js-beautify'

const formatOptions: JSBeautifyOptions = {
  indent_size: 1,
  indent_char: '\t',
  max_preserve_newlines: 5,
  preserve_newlines: true,
  brace_style: 'collapse',
  space_before_conditional: true,
  wrap_line_length: 160,
}
export const format = (source: string) => {
  return beautify(source, formatOptions)
}
