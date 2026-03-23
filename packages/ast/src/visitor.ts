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
 * Maps a node type to the set of node types that can be its parent in the AST.
 *
 * - `RootNode` is always the tree root, so it has no parent.
 * - `OperationNode` is always a direct child of `RootNode`.
 * - `SchemaNode` can appear under many parents (root, operation requestBody, property, parameter, response, or another schema via items/members/additionalProperties).
 * - `PropertyNode` always belongs to an object `SchemaNode`.
 * - `ParameterNode` and `ResponseNode` always belong to an `OperationNode`.
 */
export type ParentOf<T extends Node> =
  T extends RootNode ? undefined :
  T extends OperationNode ? RootNode :
  T extends SchemaNode ? RootNode | OperationNode | SchemaNode | PropertyNode | ParameterNode | ResponseNode :
  T extends PropertyNode ? SchemaNode :
  T extends ParameterNode ? OperationNode :
  T extends ResponseNode ? OperationNode :
  Node

/**
 * Traversal context passed as the second argument to every visitor callback.
 * The `parent` field is narrowed based on the node type being visited.
 */
export type VisitorContext<T extends Node = Node> = {
  parent?: ParentOf<T>
}

/**
 * Synchronous visitor for `transform` and `walk`.
 */
export type Visitor = {
  root?(node: RootNode, context: VisitorContext<RootNode>): void | RootNode
  operation?(node: OperationNode, context: VisitorContext<OperationNode>): void | OperationNode
  schema?(node: SchemaNode, context: VisitorContext<SchemaNode>): void | SchemaNode
  property?(node: PropertyNode, context: VisitorContext<PropertyNode>): void | PropertyNode
  parameter?(node: ParameterNode, context: VisitorContext<ParameterNode>): void | ParameterNode
  response?(node: ResponseNode, context: VisitorContext<ResponseNode>): void | ResponseNode
}

type MaybePromise<T> = T | Promise<T>

/**
 * Async visitor for `walk`. Synchronous `Visitor` objects are compatible.
 */
export type AsyncVisitor = {
  root?(node: RootNode, context: VisitorContext<RootNode>): MaybePromise<void | RootNode>
  operation?(node: OperationNode, context: VisitorContext<OperationNode>): MaybePromise<void | OperationNode>
  schema?(node: SchemaNode, context: VisitorContext<SchemaNode>): MaybePromise<void | SchemaNode>
  property?(node: PropertyNode, context: VisitorContext<PropertyNode>): MaybePromise<void | PropertyNode>
  parameter?(node: ParameterNode, context: VisitorContext<ParameterNode>): MaybePromise<void | ParameterNode>
  response?(node: ResponseNode, context: VisitorContext<ResponseNode>): MaybePromise<void | ResponseNode>
}

/**
 * Visitor for `collect`.
 */
export type CollectVisitor<T> = {
  root?(node: RootNode, context: VisitorContext<RootNode>): T | undefined
  operation?(node: OperationNode, context: VisitorContext<OperationNode>): T | undefined
  schema?(node: SchemaNode, context: VisitorContext<SchemaNode>): T | undefined
  property?(node: PropertyNode, context: VisitorContext<PropertyNode>): T | undefined
  parameter?(node: ParameterNode, context: VisitorContext<ParameterNode>): T | undefined
  response?(node: ResponseNode, context: VisitorContext<ResponseNode>): T | undefined
}

/**
 * Options for `transform` and `collect`. Extends `Visitor` with traversal settings.
 */
export type TransformOptions = Visitor & {
  depth?: VisitorDepth
  parent?: Node
}

/**
 * Options for `walk`. Extends `AsyncVisitor` with traversal settings.
 */
export type WalkOptions = AsyncVisitor & {
  depth?: VisitorDepth
  /**
   * Maximum number of sibling nodes visited concurrently.
   * @default 30
   */
  concurrency?: number
}

/**
 * Options for `collect`. Extends `CollectVisitor` with traversal settings.
 */
export type CollectOptions<T> = CollectVisitor<T> & {
  depth?: VisitorDepth
  parent?: Node
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
      return [...node.parameters, ...(node.requestBody?.schema ? [node.requestBody.schema] : []), ...node.responses]
    case 'Schema': {
      const children: Array<Node> = []

      if (!recurse) return []

      if ('properties' in node && node.properties.length > 0) children.push(...node.properties)
      if ('items' in node && node.items) children.push(...node.items)
      if ('members' in node && node.members) children.push(...node.members)
      if ('additionalProperties' in node && node.additionalProperties && node.additionalProperties !== true) children.push(node.additionalProperties)

      return children
    }
    case 'Property':
      return [node.schema]
    case 'Parameter':
      return [node.schema]
    case 'Response':
      return node.schema ? [node.schema] : []
    case 'FunctionParameter':
    case 'ObjectBindingParameter':
    case 'FunctionParameters':
      return []
  }
}

/**
 * Depth-first traversal for side effects. Visitor return values are ignored.
 * Sibling nodes at each level are visited concurrently up to `options.concurrency` (default: 30).
 */
export async function walk(node: Node, options: WalkOptions): Promise<void> {
  const recurse = (options.depth ?? visitorDepths.deep) === visitorDepths.deep
  const limit = createLimit(options.concurrency ?? WALK_CONCURRENCY)
  return _walk(node, options, recurse, limit, undefined)
}

async function _walk(node: Node, visitor: AsyncVisitor, recurse: boolean, limit: LimitFn, parent: Node | undefined): Promise<void> {
  switch (node.kind) {
    case 'Root':
      await limit(() => visitor.root?.(node, { parent: parent as ParentOf<RootNode> }))
      break
    case 'Operation':
      await limit(() => visitor.operation?.(node, { parent: parent as ParentOf<OperationNode> }))
      break
    case 'Schema':
      await limit(() => visitor.schema?.(node, { parent: parent as ParentOf<SchemaNode> }))
      break
    case 'Property':
      await limit(() => visitor.property?.(node, { parent: parent as ParentOf<PropertyNode> }))
      break
    case 'Parameter':
      await limit(() => visitor.parameter?.(node, { parent: parent as ParentOf<ParameterNode> }))
      break
    case 'Response':
      await limit(() => visitor.response?.(node, { parent: parent as ParentOf<ResponseNode> }))
      break
    case 'FunctionParameter':
    case 'ObjectBindingParameter':
    case 'FunctionParameters':
      break
  }

  const children = getChildren(node, recurse)
  await Promise.all(children.map((child) => _walk(child, visitor, recurse, limit, node)))
}

/**
 * Depth-first immutable transformation. Visitor return values replace nodes; `undefined` keeps the original.
 */
export function transform(node: RootNode, options: TransformOptions): RootNode
export function transform(node: OperationNode, options: TransformOptions): OperationNode
export function transform(node: SchemaNode, options: TransformOptions): SchemaNode
export function transform(node: PropertyNode, options: TransformOptions): PropertyNode
export function transform(node: ParameterNode, options: TransformOptions): ParameterNode
export function transform(node: ResponseNode, options: TransformOptions): ResponseNode
export function transform(node: Node, options: TransformOptions): Node
export function transform(node: Node, options: TransformOptions): Node {
  const { depth, parent, ...visitor } = options
  const recurse = (depth ?? visitorDepths.deep) === visitorDepths.deep

  switch (node.kind) {
    case 'Root': {
      let root = node
      const replaced = visitor.root?.(root, { parent: parent as ParentOf<RootNode> })
      if (replaced) root = replaced

      return {
        ...root,
        schemas: root.schemas.map((s) => transform(s, { ...options, parent: root })),
        operations: root.operations.map((op) => transform(op, { ...options, parent: root })),
      }
    }
    case 'Operation': {
      let op = node
      const replaced = visitor.operation?.(op, { parent: parent as ParentOf<OperationNode> })
      if (replaced) op = replaced

      return {
        ...op,
        parameters: op.parameters.map((p) => transform(p, { ...options, parent: op })),
        requestBody: op.requestBody
          ? { ...op.requestBody, schema: op.requestBody.schema ? transform(op.requestBody.schema, { ...options, parent: op }) : undefined }
          : undefined,
        responses: op.responses.map((r) => transform(r, { ...options, parent: op })),
      }
    }
    case 'Schema': {
      let schema = node
      const replaced = visitor.schema?.(schema, { parent: parent as ParentOf<SchemaNode> })
      if (replaced) schema = replaced

      const childOptions = { ...options, parent: schema }

      return {
        ...schema,
        ...('properties' in schema && recurse ? { properties: schema.properties.map((p) => transform(p, childOptions)) } : {}),
        ...('items' in schema && recurse ? { items: schema.items?.map((i) => transform(i, childOptions)) } : {}),
        ...('members' in schema && recurse ? { members: schema.members?.map((m) => transform(m, childOptions)) } : {}),
        ...('additionalProperties' in schema && recurse && schema.additionalProperties && schema.additionalProperties !== true
          ? { additionalProperties: transform(schema.additionalProperties, childOptions) }
          : {}),
      } as SchemaNode
    }
    case 'Property': {
      let prop = node
      const replaced = visitor.property?.(prop, { parent: parent as ParentOf<PropertyNode> })
      if (replaced) prop = replaced

      return {
        ...prop,
        schema: transform(prop.schema, { ...options, parent: prop }),
      }
    }
    case 'Parameter': {
      let param = node
      const replaced = visitor.parameter?.(param, { parent: parent as ParentOf<ParameterNode> })
      if (replaced) param = replaced

      return {
        ...param,
        schema: transform(param.schema, { ...options, parent: param }),
      }
    }
    case 'Response': {
      let response = node
      const replaced = visitor.response?.(response, { parent: parent as ParentOf<ResponseNode> })
      if (replaced) response = replaced

      return {
        ...response,
        schema: transform(response.schema, { ...options, parent: response }),
      }
    }
    case 'FunctionParameter':
    case 'ObjectBindingParameter':
    case 'FunctionParameters':
      return node
  }
}

/**
 * Combines multiple visitors into a single visitor that applies them sequentially (left to right).
 * For each node kind, the output of one visitor becomes the input of the next.
 */
export function composeTransformers(...visitors: Array<Visitor>): Visitor {
  return {
    root(node, context) {
      return visitors.reduce<RootNode>((acc, v) => v.root?.(acc, context) ?? acc, node)
    },
    operation(node, context) {
      return visitors.reduce<OperationNode>((acc, v) => v.operation?.(acc, context) ?? acc, node)
    },
    schema(node, context) {
      return visitors.reduce<SchemaNode>((acc, v) => v.schema?.(acc, context) ?? acc, node)
    },
    property(node, context) {
      return visitors.reduce<PropertyNode>((acc, v) => v.property?.(acc, context) ?? acc, node)
    },
    parameter(node, context) {
      return visitors.reduce<ParameterNode>((acc, v) => v.parameter?.(acc, context) ?? acc, node)
    },
    response(node, context) {
      return visitors.reduce<ResponseNode>((acc, v) => v.response?.(acc, context) ?? acc, node)
    },
  }
}

/**
 * Depth-first synchronous reduction. Collects non-`undefined` visitor return values into an array.
 */
export function collect<T>(node: Node, options: CollectOptions<T>): Array<T> {
  const { depth, parent, ...visitor } = options
  const recurse = (depth ?? visitorDepths.deep) === visitorDepths.deep
  const results: Array<T> = []

  let v: T | undefined
  switch (node.kind) {
    case 'Root':
      v = visitor.root?.(node, { parent: parent as ParentOf<RootNode> })
      break
    case 'Operation':
      v = visitor.operation?.(node, { parent: parent as ParentOf<OperationNode> })
      break
    case 'Schema':
      v = visitor.schema?.(node, { parent: parent as ParentOf<SchemaNode> })
      break
    case 'Property':
      v = visitor.property?.(node, { parent: parent as ParentOf<PropertyNode> })
      break
    case 'Parameter':
      v = visitor.parameter?.(node, { parent: parent as ParentOf<ParameterNode> })
      break
    case 'Response':
      v = visitor.response?.(node, { parent: parent as ParentOf<ResponseNode> })
      break
    case 'FunctionParameter':
    case 'ObjectBindingParameter':
    case 'FunctionParameters':
      break
  }
  if (v !== undefined) results.push(v)

  for (const child of getChildren(node, recurse)) {
    for (const item of collect(child, { ...options, parent: node })) {
      results.push(item)
    }
  }

  return results
}
