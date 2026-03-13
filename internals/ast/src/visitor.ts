import type { Node, OperationNode, ParameterNode, PropertyNode, ResponseNode, RootNode, SchemaNode } from './nodes/index.ts'
import { visitorDepths } from './constants.ts'
import type { VisitorDepth } from './constants.ts'

/**
 * Shared options for `walk`, `transform`, and `collect`.
 */
export type VisitorOptions = {
  depth?: VisitorDepth
}

/**
 * Synchronous visitor for `transform` and `walk`.
 */
export interface Visitor {
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
export interface AsyncVisitor {
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
export interface CollectVisitor<T> {
  root?(node: RootNode): T | undefined
  operation?(node: OperationNode): T | undefined
  schema?(node: SchemaNode): T | undefined
  property?(node: PropertyNode): T | undefined
  parameter?(node: ParameterNode): T | undefined
  response?(node: ResponseNode): T | undefined
}

/**
 * Traversable children of `node`, respecting `recurse` for schema nodes.
 */
function getChildren(node: Node, recurse: boolean): Array<Node> {
  switch (node.kind) {
    case 'Root':
      return [...node.schemas, ...node.operations]
    case 'Operation':
      return [...node.parameters, ...(node.requestBody ? [node.requestBody] : []), ...node.responses]
    case 'Schema': {
      if (!recurse) return []
      const children: Array<Node> = []
      if ('properties' in node && node.properties) children.push(...node.properties)
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
 */
export async function walk(node: Node, visitor: AsyncVisitor, options: VisitorOptions = {}): Promise<void> {
  const recurse = (options.depth ?? visitorDepths.deep) === visitorDepths.deep

  switch (node.kind) {
    case 'Root':
      await visitor.root?.(node)
      break
    case 'Operation':
      await visitor.operation?.(node)
      break
    case 'Schema':
      await visitor.schema?.(node)
      break
    case 'Property':
      await visitor.property?.(node)
      break
    case 'Parameter':
      await visitor.parameter?.(node)
      break
    case 'Response':
      await visitor.response?.(node)
      break
  }

  for (const child of getChildren(node, recurse)) {
    await walk(child, visitor, options)
  }
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
        ...('properties' in schema && recurse ? { properties: schema.properties?.map((p) => transform(p, visitor, options)) } : {}),
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
        schema: response.schema ? transform(response.schema, visitor, options) : undefined,
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
