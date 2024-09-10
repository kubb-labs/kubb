export function escape(text?: string): string {
  return text ? text.replaceAll('`', '\\`') : ''
}

/**
 * Escape all characters not included in SingleStringCharacters and DoubleStringCharacters on
 * @link http://www.ecma-international.org/ecma-262/5.1/#sec-7.8.4
 * @link https://github.com/joliss/js-string-escape/blob/master/index.js
 */

export function jsStringEscape(input: any): string {
  return `${input}`.replace(/["'\\\n\r\u2028\u2029]/g, (character) => {
    switch (character) {
      case '"':
      case "'":
      case '\\':
        return `\\${character}`
      // Four possible LineTerminator characters need to be escaped:
      case '\n':
        return '\\n'
      case '\r':
        return '\\r'
      case '\u2028':
        return '\\u2028'
      case '\u2029':
        return '\\u2029'
      default:
        return ''
    }
  })
}
