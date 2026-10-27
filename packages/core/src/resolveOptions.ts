import { ast, type Node, type OperationNode, type SchemaNode } from '@kubb/ast'
import type { Filter, Override } from './definePlugin.ts'

/**
 * Filters and overrides applied to an operation or schema's options.
 *
 * @internal
 */
export type ResolveOptionsContext<TOptions> = {
  options: TOptions
  exclude?: Array<Filter>
  include?: Array<Filter>
  override?: Array<Override<TOptions>>
}

const patternCache = new Map<string, RegExp>()
const optionsCache = new WeakMap<object, WeakMap<Node, { value: unknown }>>()

function testPattern(value: string, pattern: string | RegExp): boolean {
  if (typeof pattern === 'string') {
    let regex = patternCache.get(pattern)
    regex ??= new RegExp(pattern)
    patternCache.set(pattern, regex)
    return regex.test(value)
  }
  // .match() preserves the behavior of user-supplied global and sticky expressions.
  return value.match(pattern) !== null
}

function matchesOperation(node: OperationNode, filter: Filter): boolean {
  if (filter.type === 'extension') {
    const { extensions } = node
    return extensions !== undefined && Object.hasOwn(extensions, filter.key) && (filter.value === undefined || extensions[filter.key] === filter.value)
  }

  const { type, pattern } = filter
  if (type === 'tag') return node.tags.some((tag) => testPattern(tag, pattern))
  if (type === 'operationId') return testPattern(node.operationId, pattern)
  if (type === 'path') return node.path !== undefined && testPattern(node.path, pattern)
  if (type === 'method') return node.method !== undefined && testPattern(node.method.toLowerCase(), pattern)
  if (type === 'contentType') return node.requestBody?.content?.some((c) => testPattern(c.contentType, pattern)) ?? false
  return false
}

function matchesSchema(node: SchemaNode, filter: Filter): boolean | null {
  if (filter.type === 'schemaName') return node.name ? testPattern(node.name, filter.pattern) : false
  return null
}

function computeOptions<TOptions>(node: Node, { options, exclude = [], include, override = [] }: ResolveOptionsContext<TOptions>): TOptions | null {
  if (node.kind === ast.nodeKinds.operation) {
    if (exclude.some((filter) => matchesOperation(node, filter))) return null
    if (include && !include.some((filter) => matchesOperation(node, filter))) return null

    return { ...options, ...override.find((filter) => matchesOperation(node, filter))?.options }
  }

  if (node.kind === ast.nodeKinds.schema) {
    if (exclude.some((filter) => matchesSchema(node, filter) === true)) return null
    if (include) {
      const applicable = include.map((filter) => matchesSchema(node, filter)).filter((result) => result !== null)
      if (applicable.length > 0 && !applicable.includes(true)) return null
    }

    return { ...options, ...override.find((filter) => matchesSchema(node, filter) === true)?.options }
  }

  return options
}

/**
 * Returns `null` for filtered nodes. Caches merged options per options object and node.
 */
export function resolveOptions<TOptions>(node: Node, context: ResolveOptionsContext<TOptions>): TOptions | null {
  const { options } = context
  // Primitive options cannot be WeakMap keys.
  if (typeof options !== 'object' || options === null) {
    return computeOptions(node, context)
  }

  let byOptions = optionsCache.get(options)
  if (!byOptions) {
    byOptions = new WeakMap()
    optionsCache.set(options, byOptions)
  }

  const cached = byOptions.get(node)
  if (cached) return cached.value as TOptions | null

  const result = computeOptions(node, context)
  byOptions.set(node, { value: result })
  return result
}
