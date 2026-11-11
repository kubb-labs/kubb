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
export function string(value: string | number | boolean | undefined | null): string {
  if (value === undefined || value === null) return "''"
  return `'${Array.from(String(value), (char) => quoteEscapes.get(char) ?? char).join('')}'`
}
