import { memo } from '@internals/utils'
import { ast, type Node, type OperationNode, type SchemaNode } from '@kubb/ast'
import type { Filter, Override } from '@kubb/core'

/** Filters and overrides applied to an operation or schema's options. */
export type ResolveOptionsContext<TOptions> = {
  options: TOptions
  exclude?: Array<Filter>
  include?: Array<Filter>
  override?: Array<Override<TOptions>>
}

const patterns = memo.create<string, RegExp>()
const methodPatterns = memo.create<string, RegExp>()
const nodeCaches = memo.create<object, WeakMap<Node, unknown>>({ weak: true })
// A call without `include` never reads an include-filtered result.
const unfilteredNodeCaches = memo.create<object, WeakMap<Node, unknown>>({ weak: true })
const mergedCaches = memo.create<object, WeakMap<object, unknown>>({ weak: true })

function testPattern(value: string, pattern: string | RegExp): boolean {
  if (typeof pattern === 'string') return memo(patterns, pattern, () => new RegExp(pattern)).test(value)
  // .match() preserves the behavior of user-supplied global and sticky expressions.
  return value.match(pattern) !== null
}

// Methods match case-insensitively: the typed values are uppercase, older configs use lowercase.
function testMethod(method: string, pattern: string | RegExp): boolean {
  if (typeof pattern === 'string') return memo(methodPatterns, pattern, () => new RegExp(pattern, 'i')).test(method)
  return method.match(pattern.ignoreCase ? pattern : new RegExp(pattern.source, `${pattern.flags}i`)) !== null
}

const operationMatchers: Partial<Record<Filter['type'], (node: OperationNode, pattern: string | RegExp) => boolean>> = {
  tag: (node, pattern) => node.tags.some((tag) => testPattern(tag, pattern)),
  operationId: (node, pattern) => testPattern(node.operationId, pattern),
  path: (node, pattern) => node.path !== undefined && testPattern(node.path, pattern),
  method: (node, pattern) => node.method !== undefined && testMethod(node.method, pattern),
  contentType: (node, pattern) => node.requestBody?.content?.some((c) => testPattern(c.contentType, pattern)) ?? false,
}

function matchesExtension({ extensions }: OperationNode, { key, value }: Extract<Filter, { type: 'extension' }>): boolean {
  return extensions !== undefined && Object.hasOwn(extensions, key) && (value === undefined || extensions[key] === value)
}

function matchesOperation(node: OperationNode, filter: Filter): boolean {
  if (filter.type === 'extension') return matchesExtension(node, filter)
  return operationMatchers[filter.type]?.(node, filter.pattern) ?? false
}

function matchesSchema(node: SchemaNode, filter: Filter): boolean | null {
  if (filter.type === 'schemaName') return node.name ? testPattern(node.name, filter.pattern) : false
  return null
}

// One object per base options and matched override, so a caller can key a cache on it, such as kit's printer.
function applyOverride<TOptions>(options: TOptions, match: Override<TOptions> | undefined): TOptions {
  if (!match) return options
  const merge = () => ({ ...options, ...match.options })
  // Primitive options cannot be WeakMap keys.
  if (typeof options !== 'object' || options === null) return merge() as TOptions
  return memo(
    memo(mergedCaches, options, () => new WeakMap<object, unknown>()),
    match,
    merge,
  ) as TOptions
}

function operationOptions<TOptions>(node: OperationNode, { options, exclude = [], include, override = [] }: ResolveOptionsContext<TOptions>): TOptions | null {
  if (exclude.some((filter) => matchesOperation(node, filter))) return null
  if (include && !include.some((filter) => matchesOperation(node, filter))) return null

  return applyOverride(
    options,
    override.find((filter) => matchesOperation(node, filter)),
  )
}

function schemaOptions<TOptions>(node: SchemaNode, { options, exclude = [], include = [], override = [] }: ResolveOptionsContext<TOptions>): TOptions | null {
  if (exclude.some((filter) => matchesSchema(node, filter) === true)) return null
  const applicable = include.map((filter) => matchesSchema(node, filter)).filter((result) => result !== null)
  if (applicable.length > 0 && !applicable.includes(true)) return null

  return applyOverride(
    options,
    override.find((filter) => matchesSchema(node, filter) === true),
  )
}

function computeOptions<TOptions>(node: Node, context: ResolveOptionsContext<TOptions>): TOptions | null {
  if (node.kind === ast.node.kinds.operation) return operationOptions(node, context)
  if (node.kind === ast.node.kinds.schema) return schemaOptions(node, context)
  return context.options
}

/** Returns `null` for filtered nodes. */
export function resolveOptions<TOptions>(node: Node, context: ResolveOptionsContext<TOptions>): TOptions | null {
  const { options } = context
  // Primitive options cannot be WeakMap keys.
  if (typeof options !== 'object' || options === null) {
    return computeOptions(node, context)
  }

  const cache = memo(context.include ? nodeCaches : unfilteredNodeCaches, options, () => new WeakMap<Node, unknown>())
  return memo(cache, node, () => computeOptions(node, context)) as TOptions | null
}
