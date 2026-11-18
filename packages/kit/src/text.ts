export { dedent, indent, unquote } from '@internals/utils'

// A raw line break would end the literal.
const quoteEscapes = new Map([
  ['\\', '\\\\'],
  ["'", "\\'"],
  ['\n', '\\n'],
  ['\r', '\\r'],
])

/**
 * A single-quoted string literal with backslashes, quotes and line breaks escaped. JavaScript, TypeScript and Python read it the same way.
 */
export function quote(value: string | number | boolean | undefined | null): string {
  if (value === undefined || value === null) return "''"
  return `'${String(value).replace(/[\\'\n\r]/g, (char) => quoteEscapes.get(char)!)}'`
}
