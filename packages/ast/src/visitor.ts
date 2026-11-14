import { nodeKinds } from './constants.ts'
import type { Node } from './nodes/index.ts'
import type { InputNode } from './nodes/input.ts'
import type { NodeKind } from './nodes/base.ts'
import type { OperationNode } from './nodes/operation.ts'
import type { ParameterNode } from './nodes/parameter.ts'
import type { PropertyNode } from './nodes/property.ts'
import type { ResponseNode } from './nodes/response.ts'
import type { SchemaNode } from './nodes/schema.ts'
import { getEmbeddedJson } from './schema/embeddedJson.ts'

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
  Content: ['schema', 'stream'],
  Response: ['content', 'headers'],
  Schema: ['properties', 'items', 'members', 'additionalProperties', 'patternProperties', 'propertyNames', 'rest'],
  Property: ['schema'],
  Parameter: ['schema'],
}

/**
 * Schema fields that hold checks rather than shape: the `conditionals` entries, `contains` and a string's `content`.
 * `transform` and `collect` skip them, and `visitChildNodes` walks them with `checks: true`.
 */
export const schemaCheckKeys = ['conditionals', 'contains', 'content'] as const

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

// A check no printer emits: a `contains` that any array meets (`min: 0`, no `max`), or `content` that is not JSON.
function isNeverPrinted({ node, key }: { node: Node; key: string }): boolean {
  if (node.kind !== nodeKinds.schema) return false
  if (key === 'contains' && (node.type === 'array' || node.type === 'tuple')) return node.contains?.min === 0 && node.contains.max === undefined
  if (key === 'content' && node.type === 'string') return !getEmbeddedJson(node)
  return false
}

/**
 * Child keys of a schema walked with `checks: true`: the shape keys, then {@link schemaCheckKeys}.
 */
const SCHEMA_CHECK_VISITOR_KEYS: ReadonlyArray<string> = [...VISITOR_KEYS.Schema!, ...schemaCheckKeys]

/**
 * Children a node already passed to `visit`. A node under two keys, such as a stream item under `schema` and
 * `stream`, is visited once. The `Set` is only created once a node has a second child.
 */
type SeenChildren = { first: Node | undefined; rest: Set<Node> | undefined }

function visitOnce(child: Node, seen: SeenChildren, visit: (child: Node) => boolean): boolean {
  if (seen.first === undefined) {
    seen.first = child
    return visit(child)
  }
  if (seen.first === child || seen.rest?.has(child)) return false
  ;(seen.rest ??= new Set()).add(child)
  return visit(child)
}

function visitRecord(value: Record<string, unknown>, seen: SeenChildren, visit: (child: Node) => boolean): boolean {
  for (const name in value) {
    if (!Object.hasOwn(value, name)) continue
    const item = value[name]
    if (isNode(item) && visitOnce(item, seen, visit)) return true
  }
  return false
}

/**
 * Calls `visit` for each direct child node and stops at the first call that returns `true`.
 * With `checks: true`, a schema's {@link schemaCheckKeys} fields are walked too, except checks that cannot fail.
 */
export function visitChildNodes(node: Node, visit: (child: Node) => boolean, { checks = false }: { checks?: boolean } = {}): boolean {
  const withChecks = checks && node.kind === nodeKinds.schema
  const keys = withChecks ? SCHEMA_CHECK_VISITOR_KEYS : VISITOR_KEYS[node.kind]
  if (!keys) return false

  const record = node as unknown as Record<string, unknown>
  let seen: SeenChildren | undefined
  for (const key of keys) {
    const value = record[key]
    if (value === undefined || value === null) continue
    if (withChecks && isNeverPrinted({ node, key })) continue
    seen ??= { first: undefined, rest: undefined }
    if (Array.isArray(value)) {
      // Items can be plain objects that hold nodes, such as the `{ if, then, else }` entries of `conditionals`.
      for (const item of value) if (isNode(item) ? visitOnce(item, seen, visit) : isNodeRecord(item) && visitRecord(item, seen, visit)) return true
      continue
    }
    if (isNode(value)) {
      if (visitOnce(value, seen, visit)) return true
      continue
    }
    if (isNodeRecord(value) && visitRecord(value, seen, visit)) return true
  }
  return false
}

type FindResult = { found: SchemaNode | undefined; low: number }

const notFound: FindResult = { found: undefined, low: Number.POSITIVE_INFINITY }

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
    cache,
  }: {
    predicate: (schema: SchemaNode) => boolean
    followRefs?: boolean
    /**
     * Remembers the match below each schema (`null` for none), so later calls skip the parts of the graph they share.
     * Keep one cache per `predicate` and `followRefs` value, for example one per build.
     * In a cyclic graph, a cached call can return a different match than the first one in depth-first order.
     */
    cache?: WeakMap<SchemaNode, SchemaNode | null>
  },
): SchemaNode | undefined {
  // With `followRefs`, as in Tarjan's algorithm: the visit order of a schema still being walked, or for a finished
  // schema without a match the lowest visit order of an unfinished schema its subtree reached. Only a schema whose
  // subtree reached nothing visited before it has a final no-match; until then it waits in `pending`.
  const state = followRefs ? new Map<SchemaNode, number>() : undefined
  const pending: Array<SchemaNode> = []
  let order = 0

  const walkChildren = (current: Node, initial: FindResult): FindResult => {
    let result = initial
    visitChildNodes(current, (child) => {
      const next = walk(child)
      result = next.found || next.low < result.low ? next : result
      return next.found !== undefined
    })
    return result
  }

  const walkSchema = (current: SchemaNode): FindResult => {
    const target = state && current.type === 'ref' && current.schema ? walk(current.schema) : notFound
    if (target.found) return target
    return walkChildren(current, target)
  }

  const walk = (current: Node): FindResult => {
    if (current.kind !== nodeKinds.schema) return walkChildren(current, notFound)

    const cached = cache?.get(current)
    if (cached === null) return notFound
    if (cached) return { found: cached, low: Number.POSITIVE_INFINITY }
    if (predicate(current)) {
      cache?.set(current, current)
      return { found: current, low: Number.POSITIVE_INFINITY }
    }
    const known = state?.get(current)
    if (known !== undefined) return { found: undefined, low: known }

    const index = order++
    const start = pending.length
    state?.set(current, index)
    const result = walkSchema(current)
    if (result.found) {
      cache?.set(current, result.found)
      return result
    }
    if (!state) {
      cache?.set(current, null)
      return notFound
    }
    if (result.low < index) {
      state.set(current, result.low)
      pending.push(current)
      return result
    }
    for (const done of [...pending.splice(start), current]) {
      state.set(done, Number.POSITIVE_INFINITY)
      cache?.set(done, null)
    }
    return notFound
  }

  return walk(node).found
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
  // A node under two keys is transformed once, so both keys keep pointing at one node. Leaves never create the map.
  let done: Map<Node, Node> | undefined
  const transformOnce = (child: Node) => {
    done ??= new Map()
    const next = done.get(child) ?? transformNode(child, visitor, recurse, node)
    done.set(child, next)
    return next
  }

  for (const key of keys) {
    const value = record[key]
    if (value === undefined || value === null) continue
    if (Array.isArray(value)) {
      // Rebuild the array lazily: allocate a new array only once a child actually changes, copying
      // the unchanged prefix at that point. An unchanged array keeps its original reference and
      // allocates nothing. This also drops the per-array `.map` closure that ran on every node.
      let mapped: Array<unknown> | undefined
      for (const [i, item] of value.entries()) {
        const next = isNode(item) ? transformOnce(item) : item
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
      const next = transformOnce(value)
      if (next !== value) (updates ??= {})[key] = next
      continue
    }
    if (isNodeRecord(value)) {
      let mapped: Record<string, unknown> | undefined
      for (const [name, item] of Object.entries(value)) {
        const next = isNode(item) ? transformOnce(item) : item
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
 * Depth-first collection pass. Gathers every non-null value the visitor
 * callbacks return into an array.
 *
 * @example Collect every operationId
 * ```ts
 * const ids = collect<string>(root, {
 *   operation(node) {
 *     return node.operationId
 *   },
 * })
 * ```
 */
export function collect<T>(node: Node, options: CollectOptions<T>): Array<T> {
  const { depth, parent, ...visitor } = options
  const result: Array<T> = []
  // Plain recursion: draining nested generators costs a `yield*` hop per level for every value.
  collectInto<T>(node, visitor, (depth ?? 'deep') === 'deep', parent, result)
  return result
}

function collectInto<T>(node: Node, visitor: VisitorOf<T>, recurse: boolean, parent: Node | undefined, result: Array<T>): void {
  const v = applyVisitor<T>(node, visitor, parent)
  if (v != null) result.push(v)

  if (node.kind === nodeKinds.schema && !recurse) return
  visitChildNodes(node, (child) => {
    collectInto<T>(child, visitor, recurse, node, result)
    return false
  })
}
