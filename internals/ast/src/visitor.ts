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
 *   visitOperation(node) {
 *     console.log(node.operationId)
 *   },
 * }
 * walk(root, printer)
 * ```
 */
export interface KubbVisitor {
  visitRoot?(node: RootNode): void | RootNode
  visitOperation?(node: OperationNode): void | OperationNode
  visitSchema?(node: SchemaNode): void | SchemaNode
  visitProperty?(node: PropertyNode): void | PropertyNode
  visitParameter?(node: ParameterNode): void | ParameterNode
  visitResponse?(node: ResponseNode): void | ResponseNode
}

/**
 * Traverses the AST rooted at `node` depth-first, calling the matching
 * `visitor.visit*` method for every node encountered.
 *
 * Use `walk` for **side-effect** operations (logging, validation, …).
 * The visitor's return values are ignored.
 *
 * @example
 * ```ts
 * walk(root, {
 *   visitOperation(op) { console.log(op.operationId) },
 * })
 * ```
 */
export function walk(node: Node, visitor: KubbVisitor): void {
  switch (node.kind) {
    case 'Root': {
      const root = node as RootNode
      visitor.visitRoot?.(root)
      for (const schema of root.schemas) walk(schema, visitor)
      for (const operation of root.operations) walk(operation, visitor)
      break
    }
    case 'Operation': {
      const op = node as OperationNode
      visitor.visitOperation?.(op)
      for (const param of op.parameters) walk(param, visitor)
      if (op.requestBody) walk(op.requestBody, visitor)
      for (const response of op.responses) walk(response, visitor)
      break
    }
    case 'Schema': {
      const schema = node as SchemaNode
      visitor.visitSchema?.(schema)
      if (schema.properties) {
        for (const prop of schema.properties) walk(prop, visitor)
      }
      if (schema.items) {
        for (const item of schema.items) walk(item, visitor)
      }
      if (schema.members) {
        for (const member of schema.members) walk(member, visitor)
      }
      break
    }
    case 'Property': {
      const prop = node as PropertyNode
      visitor.visitProperty?.(prop)
      walk(prop.schema, visitor)
      break
    }
    case 'Parameter': {
      const param = node as ParameterNode
      visitor.visitParameter?.(param)
      walk(param.schema, visitor)
      break
    }
    case 'Response': {
      const response = node as ResponseNode
      visitor.visitResponse?.(response)
      if (response.schema) walk(response.schema, visitor)
      break
    }
  }
}

/**
 * Traverses the AST rooted at `node` depth-first, optionally replacing
 * nodes with the values returned by `visitor.visit*`.
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
 *   visitOperation(op) {
 *     return { ...op, operationId: `api_${op.operationId}` }
 *   },
 * }) as RootNode
 * ```
 */
export function transform(node: Node, visitor: KubbVisitor): Node {
  switch (node.kind) {
    case 'Root': {
      let root = node as RootNode
      const replaced = visitor.visitRoot?.(root)
      if (replaced) root = replaced

      return {
        ...root,
        schemas: root.schemas.map((s) => transform(s, visitor) as SchemaNode),
        operations: root.operations.map((op) => transform(op, visitor) as OperationNode),
      } as RootNode
    }
    case 'Operation': {
      let op = node as OperationNode
      const replaced = visitor.visitOperation?.(op)
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
      const replaced = visitor.visitSchema?.(schema)
      if (replaced) schema = replaced

      return {
        ...schema,
        properties: schema.properties?.map((p) => transform(p, visitor) as PropertyNode),
        items: schema.items?.map((i) => transform(i, visitor) as SchemaNode),
        members: schema.members?.map((m) => transform(m, visitor) as SchemaNode),
      } as SchemaNode
    }
    case 'Property': {
      let prop = node as PropertyNode
      const replaced = visitor.visitProperty?.(prop)
      if (replaced) prop = replaced

      return {
        ...prop,
        schema: transform(prop.schema, visitor) as SchemaNode,
      } as PropertyNode
    }
    case 'Parameter': {
      let param = node as ParameterNode
      const replaced = visitor.visitParameter?.(param)
      if (replaced) param = replaced

      return {
        ...param,
        schema: transform(param.schema, visitor) as SchemaNode,
      } as ParameterNode
    }
    case 'Response': {
      let response = node as ResponseNode
      const replaced = visitor.visitResponse?.(response)
      if (replaced) response = replaced

      return {
        ...response,
        schema: response.schema ? (transform(response.schema, visitor) as SchemaNode) : undefined,
      } as ResponseNode
    }
  }
}
