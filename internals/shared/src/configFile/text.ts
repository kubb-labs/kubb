import { type ArrayExpression, nodeTypes, type ObjectExpression } from './ast.ts'
import type { OptionValue } from './types.ts'

/**
 * A valid JavaScript identifier, so an import name can only ever print as `import { name } from`,
 * never as source that breaks out of the import statement.
 */
export const IDENTIFIER_PATTERN = /^[A-Za-z_$][\w$]*$/

export const quotes = { single: `'`, double: `"` } as const
export type Quote = (typeof quotes)[keyof typeof quotes]

/** `source` with the text between `start` and `end` replaced by `text`. */
export function replaceText(source: string, start: number, end: number, text = ''): string {
  return `${source.slice(0, start)}${text}${source.slice(end)}`
}

/** The 1-based line and 0-based column of `offset` in `source`. */
export function getPosition(source: string, offset: number): { line: number; column: number } {
  return { line: source.slice(0, offset).split('\n').length, column: offset - source.lastIndexOf('\n', offset - 1) - 1 }
}

/** Writes `value` as a single-line literal with the file's quote style. */
export function printValue(value: OptionValue, quote: Quote): string {
  if (typeof value === 'string') {
    // JSON's escaping covers every character that could end the literal or the line.
    const escaped = JSON.stringify(value).slice(1, -1)
    return quote === quotes.double ? `"${escaped}"` : `'${escaped.replaceAll(`\\"`, `"`).replaceAll(`'`, `\\'`)}'`
  }
  if (value === null || typeof value !== 'object') return String(value)
  if (Array.isArray(value)) return `[${value.map((item) => printValue(item, quote)).join(', ')}]`

  const entries = Object.entries(value)
  return entries.length ? `{ ${entries.map(([key, item]) => `${printKey(key, quote)}: ${printValue(item, quote)}`).join(', ')} }` : '{}'
}

/** An object key as source text: bare when it is an identifier, quoted otherwise. */
export function printKey(key: string, quote: Quote): string {
  return IDENTIFIER_PATTERN.test(key) ? key : printValue(key, quote)
}

/** `value` wrapped in one object per key of `path`: `wrapPath(['enum', 'type'], 'enum')` is `{ enum: { type: 'enum' } }`. */
export function wrapPath(path: Array<string>, value: OptionValue): OptionValue {
  return path.reduceRight<OptionValue>((inner, key) => ({ [key]: inner }), value)
}

/**
 * Adds `text` as the last item of an object or array literal, following its layout: on a line of
 * its own with the last item's indentation when the literal spans lines, inline otherwise.
 */
export function appendItem(source: string, container: ObjectExpression | ArrayExpression, text: string): string {
  const { start, end } = container
  const items: Array<{ start: number; end: number } | null> = container.type === nodeTypes.objectExpression ? container.properties : container.elements
  const last = items.filter((item) => item !== null).at(-1)

  if (!last) {
    const inner = source.slice(start + 1, end - 1)
    // A comment inside the empty literal stays, after the new item.
    if (inner.trim()) return replaceText(source, start + 1, start + 1, /^\s/.test(inner) ? `${text},` : `${text}, `)
    return replaceText(source, start, end, container.type === nodeTypes.objectExpression ? `{ ${text} }` : `[${text}]`)
  }

  const between = source.slice(last.end, end - 1)
  // The closing bracket shares the last item's line: add the item inline.
  if (!between.includes('\n')) return replaceText(source, last.end, last.end, `, ${text}`)

  const lineStart = source.lastIndexOf('\n', last.start - 1) + 1
  const indent = source.slice(lineStart).match(/^[ \t]*/)?.[0] ?? ''
  // After the last item's comma and any comment on its line, so neither moves. `between` holds a
  // newline, so one always follows.
  const lineEnd = source.indexOf('\n', last.end)
  const comma = /^\s*,/.test(between)

  return `${source.slice(0, last.end)}${comma ? '' : ','}${source.slice(last.end, lineEnd)}\n${indent}${text}${comma ? ',' : ''}${source.slice(lineEnd)}`
}

/** Drops the item at `index` from an object or array literal, with its own lines when it sits on them alone. */
export function removeItem(source: string, node: ObjectExpression | ArrayExpression, index: number): string {
  const items: Array<{ start: number; end: number }> =
    node.type === nodeTypes.objectExpression ? node.properties : node.elements.filter((element) => element !== null)
  if (items.length === 1) return replaceText(source, node.start, node.end, node.type === nodeTypes.objectExpression ? '{}' : '[]')

  const { start, end } = items[index]!
  const lineStart = source.lastIndexOf('\n', start - 1) + 1
  const nextNewline = source.indexOf('\n', end)
  const lineEnd = nextNewline === -1 ? source.length : nextNewline
  if (!source.slice(lineStart, start).trim() && /^\s*,?\s*(\/\/.*)?$/.test(source.slice(end, lineEnd))) {
    return replaceText(source, lineStart, Math.min(lineEnd + 1, source.length))
  }

  const next = items[index + 1]
  return next ? replaceText(source, start, next.start) : replaceText(source, items[index - 1]!.end, end)
}
