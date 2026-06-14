import { isIdentifier, singleQuote } from '@internals/utils'
import { INDENT } from '../constants.ts'

/**
 * Builds a JSDoc comment block from an array of lines, returning `fallback` when there are no
 * comments so callers always get a usable string.
 *
 * @example
 * ```ts
 * buildJSDoc(['@type string', '@example hello'])
 * // '/**\n   * @type string\n   * @example hello\n   *\/\n  '
 * ```
 */
export function buildJSDoc(
  comments: Array<string>,
  options: {
    /**
     * String used to indent each comment line.
     * @default '   * '
     */
    indent?: string
    /**
     * String appended after the closing tag.
     * @default '\n  '
     */
    suffix?: string
    /**
     * Returned as-is when `comments` is empty.
     * @default '  '
     */
    fallback?: string
  } = {},
): string {
  const { indent = '   * ', suffix = '\n  ', fallback = '  ' } = options

  if (comments.length === 0) return fallback

  return `/**\n${comments.map((c) => `${indent}${c}`).join('\n')}\n   */${suffix}`
}

/**
 * Indents every non-empty line of `text` by one indent level, leaving blank lines empty.
 */
function indentLines(text: string): string {
  if (!text) return ''
  return text
    .split('\n')
    .map((line) => (line.trim() ? `${INDENT}${line}` : ''))
    .join('\n')
}

/**
 * Renders an object key, quoting it with single quotes only when it is not a valid identifier.
 * Reserved words and globals (`name`, `class`, …) are valid bare keys and stay unquoted.
 *
 * @example
 * ```ts
 * objectKey('name')    // 'name'
 * objectKey('x-total') // "'x-total'"
 * ```
 */
export function objectKey(name: string): string {
  return isIdentifier(name) ? name : singleQuote(name)
}

/**
 * Assembles a multi-line object literal from already-rendered `entries`, indenting each entry one
 * level and closing the brace at column zero. Nested objects built the same way indent cumulatively,
 * so callers never re-parse the generated code. A trailing comma is added per entry to match the
 * formatter's multi-line style.
 *
 * @example
 * ```ts
 * buildObject(['id: z.number()', 'name: z.string()'])
 * // '{\n  id: z.number(),\n  name: z.string(),\n}'
 * ```
 */
export function buildObject(entries: Array<string>): string {
  if (entries.length === 0) return '{}'
  const body = entries.map((entry) => `${indentLines(entry)},`).join('\n')

  return `{\n${body}\n}`
}

/**
 * Assembles a bracketed list (array by default) from already-rendered `items`. Keeps everything on
 * one line when no item spans multiple lines, and otherwise puts each item on its own line, indented
 * one level with a trailing comma and the closing bracket at column zero. Use it for `z.union([…])`,
 * `z.array([…])`, and similar member lists so objects inside them nest correctly.
 *
 * @example
 * ```ts
 * buildList(['z.string()', 'z.number()'])
 * // '[z.string(), z.number()]'
 * ```
 */
export function buildList(items: Array<string>, brackets: [open: string, close: string] = ['[', ']']): string {
  const [open, close] = brackets
  if (items.length === 0) return `${open}${close}`
  if (!items.some((item) => item.includes('\n'))) return `${open}${items.join(', ')}${close}`
  const body = items.map((item) => `${indentLines(item)},`).join('\n')

  return `${open}\n${body}\n${close}`
}
