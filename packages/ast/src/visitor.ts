import type { VisitorDepth } from './constants.ts'
import { visitorDepths } from './constants.ts'
import type { NodeDef } from './defineNode.ts'
import type {
  ContentNode,
  InputNode,
  Node,
  NodeKind,
  OperationNode,
  OutputNode,
  ParameterNode,
  PropertyNode,
  RequestBodyNode,
  ResponseNode,
  SchemaNode,
} from './nodes/index.ts'
import { nodeDefs } from './registry.ts'

/**
 * Child node fields per node kind, in traversal order (Babel's `VISITOR_KEYS`).
 * Derived from each definition's `children`.
 */
const VISITOR_KEYS = Object.fromEntries(nodeDefs.flatMap((def) => (def.children ? [[def.kind, def.children] as const] : []))) as Partial<
  Record<NodeKind, ReadonlyArray<string>>
>

/**
 * Maps a node kind to the matching visitor callback name. Derived from each
 * definition's `visitorKey`.
 */
const VISITOR_KEY_BY_KIND = Object.fromEntries(nodeDefs.flatMap((def) => (def.visitorKey ? [[def.kind, def.visitorKey] as const] : []))) as Partial<
  Record<NodeKind, NonNullable<NodeDef['visitorKey']>>
>

/**
 * Ordered mapping of `[NodeType, ParentType]` pairs.
 *
 * `ParentOf` uses this map to find parent types.
 */
type ParentNodeMap = [
  [InputNode, undefined],
  [OutputNode, undefined],
  [OperationNode, InputNode],
  [RequestBodyNode, OperationNode],
  [ContentNode, RequestBodyNode | ResponseNode],
  [SchemaNode, InputNode | ContentNode | SchemaNode | PropertyNode | ParameterNode],
  [PropertyNode, SchemaNode],
  [ParameterNode, OperationNode],
  [ResponseNode, OperationNode],
]

/**
 * Resolves the parent node type for a given AST node type.
 *
 * Visitor context relies on this so `ctx.parent` is typed for each callback.
 *
 * @example
 * ```ts
 * type InputParent = ParentOf<InputNode>
 * // undefined
 * ```
 *
 * @example
 * ```ts
 * type PropertyParent = ParentOf<PropertyNode>
 * // SchemaNode
 * ```
 *
 * @example
 * ```ts
 * type SchemaParent = ParentOf<SchemaNode>
 * // InputNode | ContentNode | SchemaNode | PropertyNode | ParameterNode
 * ```
 */
export type ParentOf<T extends Node, TEntries extends ReadonlyArray<[Node, unknown]> = ParentNodeMap> = TEntries extends [
  infer TEntry extends [Node, unknown],
  ...infer TRest extends ReadonlyArray<[Node, unknown]>,
]
  ? T extends TEntry[0]
    ? TEntry[1]
    : ParentOf<T, TRest>
  : Node

/**
 * Traversal context passed as the second argument to every visitor callback.
 * `parent` is typed from the current node type.
 *
 * @example
 * ```ts
 * const visitor: Visitor = {
 *   schema(node, { parent }) {
 *     // parent type is narrowed by node kind
 *   },
 * }
 * ```
 */
export type VisitorContext<T extends Node = Node> = {
  /**
   * Parent node of the currently visited node.
   * For `InputNode`, this is `undefined`.
   */
  parent?: ParentOf<T>
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
  input?(node: InputNode, context: VisitorContext<InputNode>): undefined | null | InputNode
  output?(node: OutputNode, context: VisitorContext<OutputNode>): undefined | null | OutputNode
  operation?(node: OperationNode, context: VisitorContext<OperationNode>): undefined | null | OperationNode
  schema?(node: SchemaNode, context: VisitorContext<SchemaNode>): undefined | null | SchemaNode
  property?(node: PropertyNode, context: VisitorContext<PropertyNode>): undefined | null | PropertyNode
  parameter?(node: ParameterNode, context: VisitorContext<ParameterNode>): undefined | null | ParameterNode
  response?(node: ResponseNode, context: VisitorContext<ResponseNode>): undefined | null | ResponseNode
}

/**
 * Visitor used by `collect`.
 *
 * @example
 * ```ts
 * const visitor: CollectVisitor<string> = {
 *   operation(node) {
 *     return node.operationId
 *   },
 * }
 * ```
 */
type CollectVisitor<T> = {
  input?(node: InputNode, context: VisitorContext<InputNode>): T | null | undefined
  output?(node: OutputNode, context: VisitorContext<OutputNode>): T | null | undefined
  operation?(node: OperationNode, context: VisitorContext<OperationNode>): T | null | undefined
  schema?(node: SchemaNode, context: VisitorContext<SchemaNode>): T | null | undefined
  property?(node: PropertyNode, context: VisitorContext<PropertyNode>): T | null | undefined
  parameter?(node: ParameterNode, context: VisitorContext<ParameterNode>): T | null | undefined
  response?(node: ResponseNode, context: VisitorContext<ResponseNode>): T | null | undefined
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
export type TransformOptions = Visitor & {
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
 * Options for `collect`.
 *
 * @example
 * ```ts
 * const options: CollectOptions<string> = { depth: 'shallow', schema: () => undefined }
 * ```
 */
export type CollectOptions<T> = CollectVisitor<T> & {
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

const visitorKeysByKind = VISITOR_KEYS as Record<string, ReadonlyArray<string> | undefined>

/**
 * Returns `true` when `value` is an AST node (an object carrying a `kind`).
 */
function isNode(value: unknown): value is Node {
  return typeof value === 'object' && value !== null && typeof (value as { kind?: unknown }).kind === 'string'
}

/**
 * Returns the immediate traversable children of `node` based on {@link VISITOR_KEYS}.
 *
 * `Schema` children are only included when `recurse` is `true`. Shallow mode skips them.
 *
 * @example
 * ```ts
 * const children = getChildren(operationNode, true)
 * // returns parameters, the request body, and responses
 * ```
 */
function* getChildren(node: Node, recurse: boolean): Generator<Node, void, undefined> {
  if (node.kind === 'Schema' && !recurse) return

  const keys = visitorKeysByKind[node.kind]
  if (!keys) return

  const record = node as unknown as Record<string, unknown>
  for (const key of keys) {
    const value = record[key]
    if (Array.isArray(value)) {
      for (const item of value) if (isNode(item)) yield item
    } else if (isNode(value)) {
      yield value
    }
  }
}

/**
 * Runs the visitor callback that matches `node.kind` with the traversal
 * context. The result is a replacement node, a collected value, or `undefined`
 * when no callback is registered for the kind.
 *
 * Shared by `transform` and `collectLazy` so node-kind dispatch lives in one place.
 * `TResult` is the caller's expected return: the same node type for `transform`,
 * the collected value type for `collectLazy`.
 */
function applyVisitor<TResult>(node: Node, visitor: Visitor | CollectVisitor<unknown>, parent: Node | undefined): TResult | null | undefined {
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
export function transform(node: InputNode, options: TransformOptions): InputNode
export function transform(node: OutputNode, options: TransformOptions): OutputNode
export function transform(node: OperationNode, options: TransformOptions): OperationNode
export function transform(node: SchemaNode, options: TransformOptions): SchemaNode
export function transform(node: PropertyNode, options: TransformOptions): PropertyNode
export function transform(node: ParameterNode, options: TransformOptions): ParameterNode
export function transform(node: ResponseNode, options: TransformOptions): ResponseNode
export function transform(node: Node, options: TransformOptions): Node
export function transform(node: Node, options: TransformOptions): Node {
  const { depth, parent, ...visitor } = options
  const recurse = (depth ?? visitorDepths.deep) === visitorDepths.deep

  // Split the visitor object out once here, then thread it plus `recurse`/`parent` as plain
  // arguments through the recursion. The previous code re-ran the `...visitor` rest-destructure on
  // every recursive `transform` call and rebuilt a `{ ...options, parent }` object per node, so the
  // options shape (which callbacks are present) varied call to call and the hot recursion churned.
  return transformNode(node, visitor, recurse, parent)
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
 * Immutably rebuilds a node's children using {@link VISITOR_KEYS}, transforming
 * each child node and leaving non-node values (e.g. `additionalProperties: true`) intact.
 * `Schema` children are skipped in shallow mode.
 */
function transformChildren(node: Node, visitor: Visitor, recurse: boolean): Node {
  if (node.kind === 'Schema' && !recurse) return node

  const keys = visitorKeysByKind[node.kind]
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
    } else if (isNode(value)) {
      const next = transformNode(value, visitor, recurse, node)
      if (next !== value) (updates ??= {})[key] = next
    }
  }

  if (!updates) return node
  const merged = { ...node, ...updates }
  return merged as Node
}
/**
 * Lazy depth-first collection pass. Yields every non-null value returned by
 * the visitor callbacks. Use `collect` for the eager array form.
 *
 * @example Collect every operationId
 * ```ts
 * const ids: string[] = []
 * for (const id of collectLazy<string>(root, {
 *   operation(node) {
 *     return node.operationId
 *   },
 * })) {
 *   ids.push(id)
 * }
 * ```
 */
export function* collectLazy<T>(node: Node, options: CollectOptions<T>): Generator<T, void, undefined> {
  const { depth, parent, ...visitor } = options
  const recurse = (depth ?? visitorDepths.deep) === visitorDepths.deep

  // Thread the split-out visitor through the recursion instead of rebuilding `{ ...options, parent }`
  // for every child, mirroring `transform`. Keeps the recursive object shape stable.
  yield* collectNode<T>(node, visitor as CollectVisitor<T>, recurse, parent)
}

function* collectNode<T>(node: Node, visitor: CollectVisitor<T>, recurse: boolean, parent: Node | undefined): Generator<T, void, undefined> {
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
 * const ids = collect<string>(root, {
 *   operation(node) {
 *     return node.operationId
 *   },
 * })
 * ```
 */
export function collect<T>(node: Node, options: CollectOptions<T>): Array<T> {
  return Array.from(collectLazy(node, options))
}
