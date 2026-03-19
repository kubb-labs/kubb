import type { VisitorDepth } from './constants.ts'
import { visitorDepths, WALK_CONCURRENCY } from './constants.ts'
import type { Node, OperationNode, ParameterNode, PropertyNode, ResponseNode, RootNode, SchemaNode } from './nodes/index.ts'

/**
 * Creates a concurrency-limiting wrapper. At most `concurrency` promises may be
 * in-flight simultaneously; additional calls are queued and dispatched as slots free.
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
 * Shared options for `walk`, `transform`, and `collect`.
 */
export type VisitorOptions = {
  depth?: VisitorDepth
  /**
   * Maximum number of sibling nodes visited concurrently inside `walk`.
   * @default 30
   */
  concurrency?: number
}

/**
 * Synchronous visitor for `transform` and `walk`.
 */
export type Visitor = {
  root?(node: RootNode): void | RootNode
  operation?(node: OperationNode): void | OperationNode
  schema?(node: SchemaNode): void | SchemaNode
  property?(node: PropertyNode): void | PropertyNode
  parameter?(node: ParameterNode): void | ParameterNode
  response?(node: ResponseNode): void | ResponseNode
}

type MaybePromise<T> = T | Promise<T>

/**
 * Async visitor for `walk`. Synchronous `Visitor` objects are compatible.
 */
export type AsyncVisitor = {
  root?(node: RootNode): MaybePromise<void | RootNode>
  operation?(node: OperationNode): MaybePromise<void | OperationNode>
  schema?(node: SchemaNode): MaybePromise<void | SchemaNode>
  property?(node: PropertyNode): MaybePromise<void | PropertyNode>
  parameter?(node: ParameterNode): MaybePromise<void | ParameterNode>
  response?(node: ResponseNode): MaybePromise<void | ResponseNode>
}

/**
 * Visitor for `collect`.
 */
export type CollectVisitor<T> = {
  root?(node: RootNode): T | undefined
  operation?(node: OperationNode): T | undefined
  schema?(node: SchemaNode): T | undefined
  property?(node: PropertyNode): T | undefined
  parameter?(node: ParameterNode): T | undefined
  response?(node: ResponseNode): T | undefined
}

/**
 * Returns the immediate traversable children of `node`.
 *
 * For `Schema` nodes, children (properties, items, members) are only included
 * when `recurse` is `true`; shallow traversal omits them entirely.
 */
function getChildren(node: Node, recurse: boolean): Array<Node> {
  switch (node.kind) {
    case 'Root':
      return [...node.schemas, ...node.operations]
    case 'Operation':
      return [...node.parameters, ...(node.requestBody ? [node.requestBody] : []), ...node.responses]
    case 'Schema': {
      const children: Array<Node> = []

      if (!recurse) return []

      if ('properties' in node && node.properties.length > 0) children.push(...node.properties)
      if ('items' in node && node.items) children.push(...node.items)
      if ('members' in node && node.members) children.push(...node.members)

      return children
    }
    case 'Property':
      return [node.schema]
    case 'Parameter':
      return [node.schema]
    case 'Response':
      return node.schema ? [node.schema] : []
  }
}

/**
 * Depth-first traversal for side effects. Visitor return values are ignored.
 * Sibling nodes at each level are visited concurrently up to `options.concurrency` (default: 30).
 */
export async function walk(node: Node, visitor: AsyncVisitor, options: VisitorOptions = {}): Promise<void> {
  const recurse = (options.depth ?? visitorDepths.deep) === visitorDepths.deep
  const limit = createLimit(options.concurrency ?? WALK_CONCURRENCY)
  return _walk(node, visitor, recurse, limit)
}

/**
 * Internal recursive walk implementation — calls visitor then recurses into children.
 */
async function _walk(node: Node, visitor: AsyncVisitor, recurse: boolean, limit: LimitFn): Promise<void> {
  switch (node.kind) {
    case 'Root':
      await limit(() => visitor.root?.(node))
      break
    case 'Operation':
      await limit(() => visitor.operation?.(node))
      break
    case 'Schema':
      await limit(() => visitor.schema?.(node))
      break
    case 'Property':
      await limit(() => visitor.property?.(node))
      break
    case 'Parameter':
      await limit(() => visitor.parameter?.(node))
      break
    case 'Response':
      await limit(() => visitor.response?.(node))
      break
  }

  const children = getChildren(node, recurse)
  await Promise.all(children.map((child) => _walk(child, visitor, recurse, limit)))
}

/**
 * Depth-first immutable transformation. Visitor return values replace nodes; `undefined` keeps the original.
 */
export function transform(node: RootNode, visitor: Visitor, options?: VisitorOptions): RootNode
export function transform(node: OperationNode, visitor: Visitor, options?: VisitorOptions): OperationNode
export function transform(node: SchemaNode, visitor: Visitor, options?: VisitorOptions): SchemaNode
export function transform(node: PropertyNode, visitor: Visitor, options?: VisitorOptions): PropertyNode
export function transform(node: ParameterNode, visitor: Visitor, options?: VisitorOptions): ParameterNode
export function transform(node: ResponseNode, visitor: Visitor, options?: VisitorOptions): ResponseNode
export function transform(node: Node, visitor: Visitor, options?: VisitorOptions): Node
export function transform(node: Node, visitor: Visitor, options: VisitorOptions = {}): Node {
  const recurse = (options.depth ?? visitorDepths.deep) === visitorDepths.deep

  switch (node.kind) {
    case 'Root': {
      let root = node
      const replaced = visitor.root?.(root)
      if (replaced) root = replaced

      return {
        ...root,
        schemas: root.schemas.map((s) => transform(s, visitor, options)),
        operations: root.operations.map((op) => transform(op, visitor, options)),
      }
    }
    case 'Operation': {
      let op = node
      const replaced = visitor.operation?.(op)
      if (replaced) op = replaced

      return {
        ...op,
        parameters: op.parameters.map((p) => transform(p, visitor, options)),
        requestBody: op.requestBody ? transform(op.requestBody, visitor, options) : undefined,
        responses: op.responses.map((r) => transform(r, visitor, options)),
      }
    }
    case 'Schema': {
      let schema = node
      const replaced = visitor.schema?.(schema)
      if (replaced) schema = replaced

      return {
        ...schema,
        ...('properties' in schema && recurse ? { properties: schema.properties.map((p) => transform(p, visitor, options)) } : {}),
        ...('items' in schema && recurse ? { items: schema.items?.map((i) => transform(i, visitor, options)) } : {}),
        ...('members' in schema && recurse ? { members: schema.members?.map((m) => transform(m, visitor, options)) } : {}),
      }
    }
    case 'Property': {
      let prop = node
      const replaced = visitor.property?.(prop)
      if (replaced) prop = replaced

      return {
        ...prop,
        schema: transform(prop.schema, visitor, options),
      }
    }
    case 'Parameter': {
      let param = node
      const replaced = visitor.parameter?.(param)
      if (replaced) param = replaced

      return {
        ...param,
        schema: transform(param.schema, visitor, options),
      }
    }
    case 'Response': {
      let response = node
      const replaced = visitor.response?.(response)
      if (replaced) response = replaced

      return {
        ...response,
        schema: transform(response.schema, visitor, options),
      }
    }
  }
}

/**
 * Depth-first synchronous reduction. Collects non-`undefined` visitor return values into an array.
 */
export function collect<T>(node: Node, visitor: CollectVisitor<T>, options: VisitorOptions = {}): Array<T> {
  const recurse = (options.depth ?? visitorDepths.deep) === visitorDepths.deep
  const results: Array<T> = []

  let v: T | undefined
  switch (node.kind) {
    case 'Root':
      v = visitor.root?.(node)
      break
    case 'Operation':
      v = visitor.operation?.(node)
      break
    case 'Schema':
      v = visitor.schema?.(node)
      break
    case 'Property':
      v = visitor.property?.(node)
      break
    case 'Parameter':
      v = visitor.parameter?.(node)
      break
    case 'Response':
      v = visitor.response?.(node)
      break
  }
  if (v !== undefined) results.push(v)

  for (const child of getChildren(node, recurse)) {
    for (const item of collect(child, visitor, options)) {
      results.push(item)
    }
  }

  return results
}
