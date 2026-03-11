import type { Node } from './nodes/base.ts'
import type { OperationNode } from './nodes/operation.ts'
import type { ParameterNode } from './nodes/parameter.ts'
import type { PropertyNode } from './nodes/property.ts'
import type { ResponseNode } from './nodes/response.ts'
import type { RootNode } from './nodes/root.ts'
import type { SchemaNode } from './nodes/schema.ts'

/**
 * A visitor that can be passed to `walk` or `transform`.
 *
 * Every method is optional. Return `undefined` / `void` from a `transform`
 * visitor to keep the original node unchanged; return a new node to replace
 * it in the tree.
 *
 * @example
 * ```ts
 * const printer: KubbVisitor = {
 *   operation(node) {
 *     console.log(node.operationId)
 *   },
 * }
 * walk(root, printer)
 * ```
 */
export interface KubbVisitor {
  root?(node: RootNode): void | RootNode
  operation?(node: OperationNode): void | OperationNode
  schema?(node: SchemaNode): void | SchemaNode
  property?(node: PropertyNode): void | PropertyNode
  parameter?(node: ParameterNode): void | ParameterNode
  response?(node: ResponseNode): void | ResponseNode
}

/**
 * Traverses the AST rooted at `node` depth-first, calling the matching
 * visitor method for every node encountered.
 *
 * Use `walk` for **side-effect** operations (logging, validation, …).
 * The visitor's return values are ignored.
 *
 * @example
 * ```ts
 * walk(root, {
 *   operation(op) { console.log(op.operationId) },
 * })
 * ```
 */
export function walk(node: Node, visitor: KubbVisitor): void {
  switch (node.kind) {
    case 'Root': {
      const root = node as RootNode
      visitor.root?.(root)
      for (const schema of root.schemas) walk(schema, visitor)
      for (const operation of root.operations) walk(operation, visitor)
      break
    }
    case 'Operation': {
      const op = node as OperationNode
      visitor.operation?.(op)
      for (const param of op.parameters) walk(param, visitor)
      if (op.requestBody) walk(op.requestBody, visitor)
      for (const response of op.responses) walk(response, visitor)
      break
    }
    case 'Schema': {
      const schema = node as SchemaNode
      visitor.schema?.(schema)
      if ('properties' in schema && schema.properties) {
        for (const prop of schema.properties) walk(prop, visitor)
      }
      if ('items' in schema && schema.items) {
        for (const item of schema.items) walk(item, visitor)
      }
      if ('members' in schema && schema.members) {
        for (const member of schema.members) walk(member, visitor)
      }
      break
    }
    case 'Property': {
      const prop = node as PropertyNode
      visitor.property?.(prop)
      walk(prop.schema, visitor)
      break
    }
    case 'Parameter': {
      const param = node as ParameterNode
      visitor.parameter?.(param)
      walk(param.schema, visitor)
      break
    }
    case 'Response': {
      const response = node as ResponseNode
      visitor.response?.(response)
      if (response.schema) walk(response.schema, visitor)
      break
    }
  }
}

/**
 * Traverses the AST rooted at `node` depth-first, optionally replacing
 * nodes with the values returned by visitor methods.
 *
 * - If a visitor method returns a new node, that node **replaces** the
 *   original in the tree.
 * - If a visitor method returns `undefined` / `void`, the original node is
 *   kept unchanged.
 * - The function always returns a node of the same kind as the input.
 *
 * Use `transform` when you need an **immutable** transformed copy of the
 * tree (e.g. adding a prefix to all operation IDs).
 *
 * @example
 * ```ts
 * const prefixed = transform(root, {
 *   operation(op) {
 *     return { ...op, operationId: `api_${op.operationId}` }
 *   },
 * }) as RootNode
 * ```
 */
export function transform(node: Node, visitor: KubbVisitor): Node {
  switch (node.kind) {
    case 'Root': {
      let root = node as RootNode
      const replaced = visitor.root?.(root)
      if (replaced) root = replaced

      return {
        ...root,
        schemas: root.schemas.map((s) => transform(s, visitor) as SchemaNode),
        operations: root.operations.map((op) => transform(op, visitor) as OperationNode),
      } as RootNode
    }
    case 'Operation': {
      let op = node as OperationNode
      const replaced = visitor.operation?.(op)
      if (replaced) op = replaced

      return {
        ...op,
        parameters: op.parameters.map((p) => transform(p, visitor) as ParameterNode),
        requestBody: op.requestBody ? (transform(op.requestBody, visitor) as SchemaNode) : undefined,
        responses: op.responses.map((r) => transform(r, visitor) as ResponseNode),
      } as OperationNode
    }
    case 'Schema': {
      let schema = node as SchemaNode
      const replaced = visitor.schema?.(schema)
      if (replaced) schema = replaced

      return {
        ...schema,
        ...('properties' in schema ? { properties: schema.properties?.map((p) => transform(p, visitor) as PropertyNode) } : {}),
        ...('items' in schema ? { items: schema.items?.map((i) => transform(i, visitor) as SchemaNode) } : {}),
        ...('members' in schema ? { members: schema.members?.map((m) => transform(m, visitor) as SchemaNode) } : {}),
      } as SchemaNode
    }
    case 'Property': {
      let prop = node as PropertyNode
      const replaced = visitor.property?.(prop)
      if (replaced) prop = replaced

      return {
        ...prop,
        schema: transform(prop.schema, visitor) as SchemaNode,
      } as PropertyNode
    }
    case 'Parameter': {
      let param = node as ParameterNode
      const replaced = visitor.parameter?.(param)
      if (replaced) param = replaced

      return {
        ...param,
        schema: transform(param.schema, visitor) as SchemaNode,
      } as ParameterNode
    }
    case 'Response': {
      let response = node as ResponseNode
      const replaced = visitor.response?.(response)
      if (replaced) response = replaced

      return {
        ...response,
        schema: response.schema ? (transform(response.schema, visitor) as SchemaNode) : undefined,
      } as ResponseNode
    }
  }
}
