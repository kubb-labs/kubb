import { nodeKinds } from './constants.ts'
import type { Node } from './nodes/index.ts'
import type { InputNode } from './nodes/input.ts'
import type { NodeKind } from './nodes/base.ts'
import type { OperationNode } from './nodes/operation.ts'
import type { ParameterNode } from './nodes/parameter.ts'
import type { PropertyNode } from './nodes/property.ts'
import type { ResponseNode } from './nodes/response.ts'
import type { SchemaNode } from './nodes/schema.ts'

/**
 * Traversal depth for AST visitor utilities.
 *
 * - `'shallow'` recurses through every node except nested `Schema` subtrees, which it treats as
 *   leaves: a schema node itself is visited, but its children are not.
 * - `'deep'` recursively visits all descendant nodes, including schema subtrees.
 */
export type VisitorDepth = 'shallow' | 'deep'

/**
 * Child node fields per node kind, in traversal order (Babel's `VISITOR_KEYS`).
 */
const VISITOR_KEYS: Partial<Record<NodeKind, ReadonlyArray<string>>> = {
  Input: ['schemas', 'operations'],
  Operation: ['parameters', 'requestBody', 'responses'],
  RequestBody: ['content'],
  Content: ['schema'],
  Response: ['content'],
  Schema: ['properties', 'items', 'members', 'additionalProperties', 'patternProperties', 'propertyNames', 'rest'],
  Property: ['schema'],
  Parameter: ['schema'],
}

/** Visitor callback names in traversal order, the keys of {@link Visitor}. */
export const visitorKeys = ['input', 'operation', 'schema', 'property', 'parameter', 'response'] as const

export type VisitorKey = (typeof visitorKeys)[number]

/**
 * Maps a node kind to the matching visitor callback name.
 */
const VISITOR_KEY_BY_KIND: Partial<Record<NodeKind, VisitorKey>> = {
  Input: 'input',
  Operation: 'operation',
  Schema: 'schema',
  Property: 'property',
  Parameter: 'parameter',
  Response: 'response',
}

/**
 * Traversal context passed as the second argument to every visitor callback.
 *
 * @example
 * ```ts
 * const visitor: Visitor = {
 *   schema(node, { parent }) {
 *     // parent is the node that holds this schema, or undefined at the root
 *   },
 * }
 * ```
 */
export type VisitorContext = {
  /**
   * Parent node of the currently visited node. For the root node, this is `undefined`.
   */
  parent?: Node
}

/**
 * Synchronous visitor consumed by `transform`. Each optional callback runs
 * for the matching node type. Return a new node to replace it, or `undefined`
 * to leave it untouched.
 *
 * Plugins typically expose `transformer` so users can supply a `Visitor` that
 * rewrites the AST before printing.
 *
 * @example Prefix every operationId
 * ```ts
 * const visitor: Visitor = {
 *   operation(node) {
 *     return { ...node, operationId: `api_${node.operationId}` }
 *   },
 * }
 * ```
 *
 * @example Strip schema descriptions
 * ```ts
 * const visitor: Visitor = {
 *   schema(node) {
 *     return { ...node, description: undefined }
 *   },
 * }
 * ```
 */
export type Visitor = {
  input?(node: InputNode, context: VisitorContext): undefined | null | InputNode
  operation?(node: OperationNode, context: VisitorContext): undefined | null | OperationNode
  schema?(node: SchemaNode, context: VisitorContext): undefined | null | SchemaNode
  property?(node: PropertyNode, context: VisitorContext): undefined | null | PropertyNode
  parameter?(node: ParameterNode, context: VisitorContext): undefined | null | ParameterNode
  response?(node: ResponseNode, context: VisitorContext): undefined | null | ResponseNode
}

/**
 * The callbacks of {@link Visitor} with every return type replaced by `TResult`. `collect` uses it
 * so a visitor can yield values instead of replacement nodes.
 *
 * @example
 * ```ts
 * const visitor: VisitorOf<string> = {
 *   operation(node) {
 *     return node.operationId
 *   },
 * }
 * ```
 */
type VisitorOf<TResult> = {
  [K in keyof Visitor]?: (node: Parameters<NonNullable<Visitor[K]>>[0], context: Parameters<NonNullable<Visitor[K]>>[1]) => TResult | null | undefined
}

type TraversalOptions = {
  /**
   * Traversal depth.
   * @default 'deep'
   */
  depth?: VisitorDepth
  /**
   * Internal parent override used during recursion.
   */
  parent?: Node
}

/**
 * Options for `transform`.
 *
 * @example
 * ```ts
 * const options: TransformOptions = { depth: 'deep', schema: (node) => node }
 * ```
 *
 * @example
 * ```ts
 * // Only transform the current node, not nested children
 * const options: TransformOptions = { depth: 'shallow', schema: (node) => node }
 * ```
 */
type TransformOptions = Visitor & TraversalOptions

/**
 * Options for `collect`.
 *
 * @example
 * ```ts
 * const options: CollectOptions<string> = { depth: 'shallow', schema: () => undefined }
 * ```
 */
type CollectOptions<T> = VisitorOf<T> & TraversalOptions

/**
 * Returns `true` when `value` is an AST node (an object carrying a `kind`).
 */
function isNode(value: unknown): value is Node {
  return typeof value === 'object' && value !== null && typeof (value as { kind?: unknown }).kind === 'string'
}

/**
 * Returns `true` for a plain object that maps names to nodes, such as `patternProperties`.
 */
function isNodeRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Returns the immediate traversable children of `node`.
 *
 * @example
 * ```ts
 * const children = getChildren(operationNode, true)
 * // returns parameters, the request body, and responses
 * ```
 */
function getChildren(node: Node, recurse: boolean): Array<Node> {
  if (node.kind === nodeKinds.schema && !recurse) return []
  const children: Array<Node> = []
  visitChildNodes(node, (child) => {
    children.push(child)
    return false
  })
  return children
}

function visitChildNodes(node: Node, visit: (child: Node) => boolean): boolean {
  const keys = VISITOR_KEYS[node.kind]
  if (!keys) return false

  const record = node as unknown as Record<string, unknown>
  for (const key of keys) {
    const value = record[key]
    if (Array.isArray(value)) {
      for (const item of value) if (isNode(item) && visit(item)) return true
      continue
    }
    if (isNode(value)) {
      if (visit(value)) return true
      continue
    }
    if (isNodeRecord(value)) {
      for (const name in value) {
        if (!Object.hasOwn(value, name)) continue
        const item = value[name]
        if (isNode(item) && visit(item)) return true
      }
    }
  }
  return false
}

/**
 * Finds the first schema that matches `predicate` in depth-first order. Set `followRefs` to include resolved ref targets.
 *
 * @example
 * ```ts
 * const firstString = findSchema(operationNode, {
 *   predicate: (schema) => schema.type === 'string',
 * })
 * ```
 */
export function findSchema(
  node: Node,
  {
    predicate,
    followRefs = false,
  }: {
    predicate: (schema: SchemaNode) => boolean
    followRefs?: boolean
  },
): SchemaNode | undefined {
  const seen = followRefs ? new WeakSet<SchemaNode>() : undefined
  const walk = (current: Node): SchemaNode | undefined => {
    if (current.kind === nodeKinds.schema) {
      if (predicate(current)) return current
      if (seen) {
        if (seen.has(current)) return undefined
        seen.add(current)
        if (current.type === 'ref' && current.schema) {
          const found = walk(current.schema)
          if (found) return found
        }
      }
    }

    let found: SchemaNode | undefined
    visitChildNodes(current, (child) => {
      found = walk(child)
      return found !== undefined
    })
    if (found) return found
    return undefined
  }
  return walk(node)
}

/**
 * Runs the visitor callback that matches `node.kind` with the traversal
 * context. The result is a replacement node, a collected value, or `undefined`
 * when no callback is registered for the kind.
 *
 * Shared by `transform` and `collect` so node-kind dispatch lives in one place.
 * `TResult` is the caller's expected return: the same node type for `transform`,
 * the collected value type for `collect`.
 */
function applyVisitor<TResult>(node: Node, visitor: Visitor | VisitorOf<unknown>, parent: Node | undefined): TResult | null | undefined {
  const key = VISITOR_KEY_BY_KIND[node.kind]
  if (!key) return undefined

  const fn = visitor[key] as ((node: Node, context: VisitorContext) => TResult | null | undefined) | undefined

  return fn?.(node, { parent })
}

/**
 * Synchronous depth-first transform. Each visitor callback can return a
 * replacement node. Returning `undefined` keeps the original.
 *
 * The original tree is never mutated, a new tree is returned. Pass
 * `depth: 'shallow'` to skip recursion into children.
 *
 * @example Prefix every operationId
 * ```ts
 * const next = transform(root, {
 *   operation(node) {
 *     return { ...node, operationId: `prefixed_${node.operationId}` }
 *   },
 * })
 * ```
 *
 * @example Replace only the root node
 * ```ts
 * const next = transform(root, {
 *   depth: 'shallow',
 *   input: (node) => ({ ...node, meta: { ...node.meta, title: 'Rewritten' } }),
 * })
 * ```
 */
export function transform<T extends Node>(node: T, options: TransformOptions): T {
  const { depth, parent, ...visitor } = options
  const recurse = (depth ?? 'deep') === 'deep'

  // Split the visitor object out once here, then thread it plus `recurse`/`parent` as plain
  // arguments through the recursion. The previous code re-ran the `...visitor` rest-destructure on
  // every recursive `transform` call and rebuilt a `{ ...options, parent }` object per node, so the
  // options shape (which callbacks are present) varied call to call and the hot recursion churned.
  return transformNode(node, visitor, recurse, parent) as T
}

/**
 * Visits a single node, then immutably rebuilds its children. Returns the original
 * reference when neither the visitor nor the child rebuild changed anything, so callers
 * can detect "nothing changed" by identity and ancestors avoid reallocating.
 */
function transformNode(node: Node, visitor: Visitor, recurse: boolean, parent: Node | undefined): Node {
  const visited = applyVisitor<Node>(node, visitor, parent) ?? node
  return transformChildren(visited, visitor, recurse)
}

/**
 * Immutably rebuilds a node's children, transforming each child node and leaving non-node values
 * (e.g. `additionalProperties: true`) intact.
 */
function transformChildren(node: Node, visitor: Visitor, recurse: boolean): Node {
  const keys = node.kind === nodeKinds.schema && !recurse ? undefined : VISITOR_KEYS[node.kind]
  if (!keys) return node

  const record = node as unknown as Record<string, unknown>
  let updates: Record<string, unknown> | undefined

  for (const key of keys) {
    if (!(key in record)) continue
    const value = record[key]
    if (Array.isArray(value)) {
      // Rebuild the array lazily: allocate a new array only once a child actually changes, copying
      // the unchanged prefix at that point. An unchanged array keeps its original reference and
      // allocates nothing. This also drops the per-array `.map` closure that ran on every node.
      let mapped: Array<unknown> | undefined
      for (const [i, item] of value.entries()) {
        const next = isNode(item) ? transformNode(item, visitor, recurse, node) : item
        if (mapped) {
          mapped.push(next)
          continue
        }
        if (next !== item) mapped = [...value.slice(0, i), next]
      }
      if (mapped) (updates ??= {})[key] = mapped
      continue
    }
    if (isNode(value)) {
      const next = transformNode(value, visitor, recurse, node)
      if (next !== value) (updates ??= {})[key] = next
      continue
    }
    if (isNodeRecord(value)) {
      let mapped: Record<string, unknown> | undefined
      for (const [name, item] of Object.entries(value)) {
        const next = isNode(item) ? transformNode(item, visitor, recurse, node) : item
        if (next !== item) (mapped ??= { ...value })[name] = next
      }
      if (mapped) (updates ??= {})[key] = mapped
    }
  }

  if (!updates) return node
  const merged = { ...node, ...updates }
  return merged as Node
}

/**
 * Lazy depth-first collection pass. Yields every non-null value returned by
 * the visitor callbacks. Use `collectSync` for the eager array form.
 *
 * @example Collect every operationId
 * ```ts
 * const ids: string[] = []
 * for (const id of collect<string>(root, {
 *   operation(node) {
 *     return node.operationId
 *   },
 * })) {
 *   ids.push(id)
 * }
 * ```
 */
export function* collect<T>(node: Node, options: CollectOptions<T>): Generator<T, void, undefined> {
  const { depth, parent, ...visitor } = options
  const recurse = (depth ?? 'deep') === 'deep'

  // Thread the split-out visitor through the recursion instead of rebuilding `{ ...options, parent }`
  // for every child, mirroring `transform`. Keeps the recursive object shape stable.
  yield* collectNode<T>(node, visitor, recurse, parent)
}

function* collectNode<T>(node: Node, visitor: VisitorOf<T>, recurse: boolean, parent: Node | undefined): Generator<T, void, undefined> {
  const v = applyVisitor<T>(node, visitor, parent)
  if (v != null) yield v

  for (const child of getChildren(node, recurse)) {
    yield* collectNode<T>(child, visitor, recurse, node)
  }
}

/**
 * Eager depth-first collection pass. Gathers every non-null value the visitor
 * callbacks return into an array.
 *
 * @example Collect every operationId
 * ```ts
 * const ids = collectSync<string>(root, {
 *   operation(node) {
 *     return node.operationId
 *   },
 * })
 * ```
 */
export function collectSync<T>(node: Node, options: CollectOptions<T>): Array<T> {
  const { depth, parent, ...visitor } = options
  const result: Array<T> = []
  // Plain recursion: draining nested generators costs a `yield*` hop per level for every value.
  collectInto<T>(node, visitor, (depth ?? 'deep') === 'deep', parent, result)
  return result
}

function collectInto<T>(node: Node, visitor: VisitorOf<T>, recurse: boolean, parent: Node | undefined, result: Array<T>): void {
  const v = applyVisitor<T>(node, visitor, parent)
  if (v != null) result.push(v)

  for (const child of getChildren(node, recurse)) {
    collectInto<T>(child, visitor, recurse, node, result)
  }
}
