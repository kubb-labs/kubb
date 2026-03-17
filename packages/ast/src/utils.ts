import { isOperationNode, isSchemaNode } from './guards.ts'
import type { Node, OperationNode, SchemaNode } from './nodes/index.ts'
import type { SchemaType } from './nodes/schema.ts'
import { narrowSchema } from './guards.ts'

const plainStringTypes = new Set<SchemaType>(['string', 'uuid', 'email', 'url', 'datetime'])

/**
 * Returns `true` when a schema node will be represented as a plain string in generated code.
 *
 * - `string`, `uuid`, `email`, `url`, `datetime` are always plain strings.
 * - `date` and `time` are plain strings when their `representation` is `'string'` rather than `'date'`.
 */
export function isPlainStringType(node: SchemaNode): boolean {
  if (plainStringTypes.has(node.type)) {
    return true
  }

  const temporal = narrowSchema(node, 'date') ?? narrowSchema(node, 'time')
  if (temporal) {
    return temporal.representation !== 'date'
  }

  return false
}

type FilterItem = {
  type: string
  pattern: string | RegExp
}

type OverrideItem<TOptions> = FilterItem & {
  options: Partial<TOptions>
}

type ResolveOptionsContext<TOptions> = {
  options: TOptions
  exclude?: Array<FilterItem>
  include?: Array<FilterItem>
  override?: Array<OverrideItem<TOptions>>
}

function matchesOperationPattern(node: OperationNode, type: string, pattern: string | RegExp): boolean {
  switch (type) {
    case 'tag':
      return node.tags.some((tag) => !!tag.match(pattern))
    case 'operationId':
      return !!node.operationId.match(pattern)
    case 'path':
      return !!node.path.match(pattern)
    case 'method':
      return !!(node.method.toLowerCase() as string).match(pattern)
    default:
      return false
  }
}

function matchesSchemaPattern(node: SchemaNode, type: string, pattern: string | RegExp): boolean {
  if (type === 'schemaName' && node.name) {
    return !!node.name.match(pattern)
  }
  return false
}

/**
 * Resolves the effective plugin options for a given AST node by applying
 * `exclude`, `include`, and `override` rules from the plugin configuration.
 *
 * Returns `null` when the node is excluded or not matched by `include`.
 * Returns the merged options (base options merged with any matching `override`) otherwise.
 *
 * Supported filter types for `OperationNode`: `tag`, `operationId`, `path`, `method`.
 * Supported filter types for `SchemaNode`: `schemaName`.
 *
 * @example
 * const resolved = resolveOptions(operationNode, { options, exclude, include, override })
 * if (!resolved) return // excluded
 */
export function resolveOptions<TOptions>(node: Node, { options, exclude = [], include, override = [] }: ResolveOptionsContext<TOptions>): TOptions | null {
  if (isOperationNode(node)) {
    const isExcluded = exclude.some(({ type, pattern }) => matchesOperationPattern(node, type, pattern))
    if (isExcluded) {
      return null
    }

    if (include && !include.some(({ type, pattern }) => matchesOperationPattern(node, type, pattern))) {
      return null
    }

    const overrideOptions = override.find(({ type, pattern }) => matchesOperationPattern(node, type, pattern))?.options

    return { ...options, ...overrideOptions }
  }

  if (isSchemaNode(node)) {
    const isExcluded = exclude.some(({ type, pattern }) => matchesSchemaPattern(node, type, pattern))
    if (isExcluded) {
      return null
    }

    if (include && !include.some(({ type, pattern }) => matchesSchemaPattern(node, type, pattern))) {
      return null
    }

    const overrideOptions = override.find(({ type, pattern }) => matchesSchemaPattern(node, type, pattern))?.options

    return { ...options, ...overrideOptions }
  }

  return options
}

