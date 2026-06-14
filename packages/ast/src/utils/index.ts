import { isIdentifier, pascalCase, singleQuote } from '@internals/utils'
import { INDENT } from '../constants.ts'
import type { OperationNode, ParameterNode } from '../nodes/index.ts'
import type { OperationParamsResolver, ParamGroupType } from './ast.ts'

export { isValidVarName } from '@internals/utils'
export { extractStringsFromNodes } from './extractStringsFromNodes.ts'
export { getNestedAccessor, jsStringEscape, stringify, stringifyObject, toRegExpString, trimQuotes } from './strings.ts'
export {
  buildGroupParam,
  buildTypeLiteral,
  caseParams,
  collectUsedSchemaNames,
  containsCircularRef,
  findCircularSchemas,
  isStringType,
  resolveParamType,
  syncSchemaRef,
} from './ast.ts'
export type { BuildGroupArgs, ParamGroupType } from './ast.ts'

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

/**
 * Derives a {@link ParamGroupType} for a query or header group from the resolver.
 *
 * Returns `null` when there is no resolver, no params, or the group name equals the
 * individual param name (so there is no real group to emit).
 */
export function resolveGroupType({
  node,
  params,
  group,
  resolver,
}: {
  node: OperationNode
  params: Array<ParameterNode>
  group: 'query' | 'header'
  resolver: OperationParamsResolver | undefined
}): ParamGroupType | null {
  if (!resolver || !params.length) {
    return null
  }
  const firstParam = params[0]!
  const groupMethod = group === 'query' ? resolver.resolveQueryParamsName : resolver.resolveHeaderParamsName
  const groupName = groupMethod.call(resolver, node, firstParam)
  if (groupName === resolver.resolveParamName(node, firstParam)) {
    return null
  }
  return { type: groupName, optional: params.every((p) => !p.required) }
}
