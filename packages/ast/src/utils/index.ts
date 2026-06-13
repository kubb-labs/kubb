import { isIdentifier, pascalCase, singleQuote } from '@internals/utils'
import { INDENT } from '../constants.ts'

export { isValidVarName } from '@internals/utils'

/**
 * Strips a single matching pair of `"..."`, `'...'`, or `` `...` `` from both ends of `text`.
 * Returns the string unchanged when no balanced quote pair is found.
 *
 * @example
 * ```ts
 * trimQuotes('"hello"') // 'hello'
 * trimQuotes('hello')   // 'hello'
 * ```
 */
export function trimQuotes(text: string): string {
  if (text.length >= 2) {
    const first = text[0]
    const last = text[text.length - 1]
    if ((first === '"' && last === '"') || (first === "'" && last === "'") || (first === '`' && last === '`')) {
      return text.slice(1, -1)
    }
  }
  return text
}

/**
 * Serializes a primitive value to a single-quoted string literal, stripping any surrounding quote
 * characters first. Escaping comes from `JSON.stringify`, then the quote style switches to single
 * quotes so generated code matches the repo style without a formatter.
 *
 * @example
 * ```ts
 * stringify('hello')   // "'hello'"
 * stringify('"hello"') // "'hello'"
 * ```
 */
export function stringify(value: string | number | boolean | undefined): string {
  if (value === undefined || value === null) return "''"
  const json = JSON.stringify(trimQuotes(value.toString()))
  const inner = json.slice(1, -1).replace(/\\"/g, '"').replace(/'/g, "\\'")
  return `'${inner}'`
}

/**
 * Escapes characters that are not allowed inside JS string literals, covering quotes, backslashes,
 * and the Unicode line terminators U+2028 and U+2029.
 *
 * @see http://www.ecma-international.org/ecma-262/5.1/#sec-7.8.4
 *
 * @example
 * ```ts
 * jsStringEscape('say "hi"\nbye') // 'say \\"hi\\"\\nbye'
 * ```
 */
export function jsStringEscape(input: unknown): string {
  return `${input}`.replace(/["'\\\n\r\u2028\u2029]/g, (character) => {
    switch (character) {
      case '"':
      case "'":
      case '\\':
        return `\\${character}`
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

/**
 * Converts a pattern string into a `new RegExp(...)` constructor call or a regex literal string.
 * Inline flags expressed as a `^(?im)` prefix are extracted and applied to the resulting expression.
 * Pass `null` as the second argument to emit a `/pattern/flags` literal instead.
 *
 * @example
 * ```ts
 * toRegExpString('^(?im)foo')       // 'new RegExp("^foo", "im")'
 * toRegExpString('^(?im)foo', null) // '/^foo/im'
 * ```
 */
export function toRegExpString(text: string, func: string | null = 'RegExp'): string {
  const raw = trimQuotes(text)

  const match = raw.match(/^\^(\(\?([igmsuy]+)\))/i)
  const replacementTarget = match?.[1] ?? ''
  const matchedFlags = match?.[2]
  const cleaned = raw
    .replace(/^\\?\//, '')
    .replace(/\\?\/$/, '')
    .replace(replacementTarget, '')

  const { source, flags } = new RegExp(cleaned, matchedFlags)

  if (func === null) return `/${source}/${flags}`

  return `new ${func}(${JSON.stringify(source)}${flags ? `, ${JSON.stringify(flags)}` : ''})`
}

/**
 * Renders a plain object as multi-line `key: value` source for embedding in generated code. Nested
 * objects recurse with fixed indentation, so the result drops straight into an object literal
 * without re-parsing.
 *
 * @example
 * ```ts
 * stringifyObject({ foo: 'bar', nested: { a: 1 } })
 * // 'foo: bar,\nnested: {\n        a: 1\n      }'
 * ```
 */
export function stringifyObject(value: Record<string, unknown>): string {
  const items = Object.entries(value)
    .map(([key, val]) => {
      if (val !== null && typeof val === 'object') {
        return `${key}: {\n        ${stringifyObject(val as Record<string, unknown>)}\n      }`
      }
      return `${key}: ${val}`
    })
    .filter(Boolean)
  return items.join(',\n')
}

/**
 * Renders a dotted path or string array as an optional-chaining accessor expression rooted at
 * `accessor`. Returns `null` for an empty path.
 *
 * @example
 * ```ts
 * getNestedAccessor('pagination.next.id', 'lastPage')
 * // "lastPage?.['pagination']?.['next']?.['id']"
 * ```
 */
export function getNestedAccessor(param: string | Array<string>, accessor: string): string | null {
  const parts = Array.isArray(param) ? param : param.split('.')
  if (parts.length === 0 || (parts.length === 1 && parts[0] === '')) return null
  return `${accessor}?.['${`${parts.join("']?.['")}']`}`
}

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

/**
 * Returns the last path segment of a reference string.
 *
 * @example
 * ```ts
 * extractRefName('#/components/schemas/Pet') // 'Pet'
 * ```
 */
export function extractRefName(ref: string): string {
  return ref.split('/').at(-1) ?? ref
}

/**
 * Builds a PascalCase child schema name by joining a parent name and property name.
 * Returns `null` when there is no parent to nest under.
 *
 * @example
 * ```ts
 * childName('Order', 'shipping_address') // 'OrderShippingAddress'
 * childName(undefined, 'params')         // null
 * ```
 */
export function childName(parentName: string | null | undefined, propName: string): string | null {
  return parentName ? pascalCase([parentName, propName].join(' ')) : null
}

/**
 * Builds a PascalCase enum name from the parent name, property name, and a suffix, skipping any
 * empty parts.
 *
 * @example
 * ```ts
 * enumPropName('Order', 'status', 'enum') // 'OrderStatusEnum'
 * ```
 */
export function enumPropName(parentName: string | null | undefined, propName: string, enumSuffix: string): string {
  return pascalCase([parentName, propName, enumSuffix].filter(Boolean).join(' '))
}

/**
 * Returns the discriminator key whose mapping value matches `ref`, or `null` when there is no match.
 *
 * @example
 * ```ts
 * findDiscriminator({ dog: '#/components/schemas/Dog' }, '#/components/schemas/Dog') // 'dog'
 * ```
 */
export function findDiscriminator(mapping: Record<string, string> | undefined, ref: string | undefined): string | null {
  if (!mapping || !ref) return null
  return Object.entries(mapping).find(([, value]) => value === ref)?.[0] ?? null
}
