/**
 * Indents every non-empty line of `text` by `unit`, leaving blank lines empty.
 * @example
 * `indent({ text: 'a\n\nb' }) // '  a\n\n  b'`
 */
export function indent({ text, unit = '  ' }: { text: string; unit?: string }): string {
  if (!text) return ''
  return text
    .split('\n')
    .map((line) => (line.trim() ? `${unit}${line}` : ''))
    .join('\n')
}

/**
 * Strips the common leading whitespace and the surrounding blank lines, counting tabs and spaces alike, so indented template literals start at column zero.
 */
export function dedent(text: string): string {
  if (!text) return ''
  // Most text nodes are one line, so the common indent is its leading whitespace.
  if (!text.includes('\n')) return text.trim() ? text.trimStart() : ''

  const lines = text.split('\n')
  const indents = lines.map((line) => {
    const indent = line.length - line.trimStart().length
    return indent === line.length ? -1 : indent
  })
  const start = indents.findIndex((indent) => indent !== -1)
  if (start === -1) return ''
  const end = indents.findLastIndex((indent) => indent !== -1)
  // `-1` marks a blank line. `reduce`, not `Math.min(...indents)`, which overflows the stack on very long text.
  const min = indents.reduce((lowest, indent) => (indent !== -1 && indent < lowest ? indent : lowest), Infinity)

  return lines
    .slice(start, end + 1)
    .map((line, i) => (indents[start + i] === -1 ? '' : line.slice(min)))
    .join('\n')
}

/**
 * Strips one matching pair of `"`, `'` or `` ` `` from both ends of `text`. Returns `text` unchanged without a matching pair.
 * @example
 * `unquote('"hello"') // 'hello'`
 */
export function unquote(text: string): string {
  if (text.length < 2) return text
  const first = text[0]
  return (first === '"' || first === "'" || first === '`') && text.at(-1) === first ? text.slice(1, -1) : text
}
