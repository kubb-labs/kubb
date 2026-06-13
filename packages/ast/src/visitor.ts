import type { VisitorDepth } from './constants.ts'
import { visitorDepths, WALK_CONCURRENCY } from './constants.ts'
import { nodeRebuilders, VISITOR_KEY_BY_KIND, VISITOR_KEYS } from './registry.ts'
import type {
  ContentNode,
  InputNode,
  Node,
  OperationNode,
  OutputNode,
  ParameterNode,
  PropertyNode,
  RequestBodyNode,
  ResponseNode,
  SchemaNode,
} from './nodes/index.ts'

/**
 * Creates a small async concurrency limiter.
 *
 * At most `concurrency` tasks are in flight at once. Extra tasks are queued.
 *
 * @example
 * ```ts
 * const limit = createLimit(2)
 * for (const task of [taskA, taskB, taskC]) {
 *   await limit(() => task())
 * }
 * // only 2 tasks run at the same time
 * ```
 */
function createLimit(concurrency: number) {
  let active = 0
  const queue: Array<() => void> = []

  function next() {
    if (active < concurrency && queue.length > 0) {
      active++
      queue.shift()!()
    }
  }

  return function limit<T>(fn: () => Promise<T> | T): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      queue.push(() => {
        Promise.resolve(fn())
          .then(resolve, reject)
          .finally(() => {
            active--
            next()
          })
      })
      next()
    })
  }
}

type LimitFn = ReturnType<typeof createLimit>

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
 * This is used by visitor context so `ctx.parent` is correctly typed
 * for each callback.
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
 * // InputNode | OperationNode | SchemaNode | PropertyNode | ParameterNode | ResponseNode
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
 * rewrites operation IDs, drops descriptions, or otherwise tweaks the AST
 * before printing.
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
 * Utility type for values that can be returned directly or asynchronously.
 */
type MaybePromise<T> = T | Promise<T>

/**
 * Async visitor for `walk`. Synchronous `Visitor` objects are compatible.
 *
 * @example
 * ```ts
 * const visitor: AsyncVisitor = {
 *   async operation(node) {
 *     await Promise.resolve(node.operationId)
 *   },
 * }
 * ```
 */
type AsyncVisitor = {
  input?(node: InputNode, context: VisitorContext<InputNode>): MaybePromise<undefined | null | InputNode>
  output?(node: OutputNode, context: VisitorContext<OutputNode>): MaybePromise<undefined | null | OutputNode>
  operation?(node: OperationNode, context: VisitorContext<OperationNode>): MaybePromise<undefined | null | OperationNode>
  schema?(node: SchemaNode, context: VisitorContext<SchemaNode>): MaybePromise<undefined | null | SchemaNode>
  property?(node: PropertyNode, context: VisitorContext<PropertyNode>): MaybePromise<undefined | null | PropertyNode>
  parameter?(node: ParameterNode, context: VisitorContext<ParameterNode>): MaybePromise<undefined | null | ParameterNode>
  response?(node: ResponseNode, context: VisitorContext<ResponseNode>): MaybePromise<undefined | null | ResponseNode>
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
   * Traversal depth (`'deep'` by default).
   * @default 'deep'
   */
  depth?: VisitorDepth
  /**
   * Internal parent override used during recursion.
   */
  parent?: Node
}

/**
 * Options for `walk`.
 *
 * @example
 * ```ts
 * const options: WalkOptions = { depth: 'deep', concurrency: 10, root: () => {} }
 * ```
 */
export type WalkOptions = AsyncVisitor & {
  /**
   * Traversal depth (`'deep'` by default).
   * @default 'deep'
   */
  depth?: VisitorDepth
  /**
   * Maximum number of sibling nodes visited concurrently.
   * @default 30
   */
  concurrency?: number
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
   * Traversal depth (`'deep'` by default).
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
  return typeof value === 'object' && value !== null && 'kind' in value
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
 * Invokes the visitor callback that matches `node.kind`, passing the traversal
 * context. Returns the callback's result (a replacement node, a collected
 * value, or `undefined` when no callback is registered for the kind).
 *
 * Shared by `walk`, `transform`, and `collectLazy` so node-kind dispatch lives
 * in one place. `TResult` is the caller's expected return: the same node type
 * for `transform`, the collected value type for `collectLazy`, ignored for `walk`.
 */
function applyVisitor<TResult>(node: Node, visitor: Visitor | AsyncVisitor | CollectVisitor<unknown>, parent: Node | undefined): TResult | null | undefined {
  const key = VISITOR_KEY_BY_KIND[node.kind]
  if (!key) return undefined

  const fn = visitor[key] as ((node: Node, context: VisitorContext) => TResult | null | undefined) | undefined

  return fn?.(node, { parent })
}

/**
 * Async depth-first traversal for side effects. Visitor return values are
 * ignored. Use `transform` when you want to rewrite nodes.
 *
 * Sibling nodes at each depth run concurrently up to `options.concurrency`
 * (defaults to `WALK_CONCURRENCY`). Higher values overlap I/O-bound visitor
 * work. Lower values reduce memory pressure.
 *
 * @example Log every operation
 * ```ts
 * await walk(root, {
 *   operation(node) {
 *     console.log(node.operationId)
 *   },
 * })
 * ```
 *
 * @example Only visit the root node
 * ```ts
 * await walk(root, { depth: 'shallow', input: () => {} })
 * ```
 */
export async function walk(node: Node, options: WalkOptions): Promise<void> {
  const recurse = (options.depth ?? visitorDepths.deep) === visitorDepths.deep
  const limit = createLimit(options.concurrency ?? WALK_CONCURRENCY)

  return _walk(node, options, recurse, limit, undefined)
}

async function _walk(node: Node, visitor: AsyncVisitor, recurse: boolean, limit: LimitFn, parent: Node | undefined): Promise<void> {
  await limit(() => applyVisitor(node, visitor, parent))

  // Visit siblings concurrently and let the shared `limit` cap how many callbacks
  // run at once. Awaiting each child sequentially here would serialize the whole
  // traversal and make `concurrency` inert, every visitor callback would run one
  // at a time regardless of the limit.
  const children = Array.from(getChildren(node, recurse))
  if (children.length === 0) return

  await Promise.all(children.map((child) => _walk(child, visitor, recurse, limit, node)))
}

/**
 * Synchronous depth-first transform. Each visitor callback gets a chance to
 * return a replacement node; `undefined` keeps the original.
 *
 * The transform is immutable. The original tree is not mutated. A new tree
 * is returned. Use `depth: 'shallow'` to skip recursion into children.
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

  const visited = applyVisitor<Node>(node, visitor, parent) ?? node
  const rebuilt = transformChildren(visited, options, recurse)

  // Structural sharing: when the visitor and child rebuild both left this node
  // untouched, return the original reference so callers can detect "nothing
  // changed" by identity and ancestors can avoid reallocating.
  if (rebuilt === node) return node

  const rebuild = nodeRebuilders[rebuilt.kind]
  return rebuild ? rebuild(rebuilt) : rebuilt
}

/**
 * Immutably rebuilds a node's children using {@link VISITOR_KEYS}, transforming
 * each child node and leaving non-node values (e.g. `additionalProperties: true`) intact.
 * `Schema` children are skipped in shallow mode.
 */
function transformChildren(node: Node, options: TransformOptions, recurse: boolean): Node {
  if (node.kind === 'Schema' && !recurse) return node

  const keys = visitorKeysByKind[node.kind]
  if (!keys) return node

  const record = node as unknown as Record<string, unknown>
  const childOptions = { ...options, parent: node }
  let updates: Record<string, unknown> | undefined

  for (const key of keys) {
    if (!(key in record)) continue
    const value = record[key]
    if (Array.isArray(value)) {
      let changed = false
      const mapped = value.map((item) => {
        if (!isNode(item)) return item
        const next = transform(item, childOptions)
        if (next !== item) changed = true
        return next
      })
      if (changed) (updates ??= {})[key] = mapped
    } else if (isNode(value)) {
      const next = transform(value, childOptions)
      if (next !== value) (updates ??= {})[key] = next
    }
  }

  return updates ? ({ ...node, ...updates } as Node) : node
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

  const v = applyVisitor<T>(node, visitor, parent)
  if (v != null) yield v

  for (const child of getChildren(node, recurse)) {
    yield* collectLazy(child, { ...options, parent: node })
  }
}

/**
 * Eager depth-first collection pass. Returns an array of every non-null value
 * the visitor callbacks return.
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
