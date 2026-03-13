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
 * const printer: Visitor = {
 *   operation(node) {
 *     console.log(node.operationId)
 *   },
 * }
 * walk(root, printer)
 * ```
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
 * Async variant of {@link Visitor} for use with the async {@link walk} function.
 *
 * Every method is optional and may return a `Promise`. Sync visitors
 * ({@link Visitor}) are structurally compatible and can be passed to
 * `walk` without any changes.
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
 * A visitor that can be passed to {@link collect}.
 *
 * Every method is optional. Return a value `T` to include it in the result
 * array; return `undefined` to skip the node.
 *
 * @example
 * ```ts
 * const refs = collect(root, {
 *   schema(node) {
 *     if (node.type === 'ref') return node
 *   },
 * })
 * ```
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
 * Traverses the AST rooted at `node` depth-first, calling the matching
 * visitor method for every node encountered.
 *
 * Use `walk` for **side-effect** operations (logging, validation, …).
 * The visitor's return values are ignored.
 *
 * Visitor methods may be `async`; `walk` awaits each one before continuing.
 *
 * @example
 * ```ts
 * await walk(root, {
 *   async operation(op) { await doSomething(op.operationId) },
 * })
 * ```
 */
export async function walk(node: Node, visitor: AsyncVisitor): Promise<void> {
  switch (node.kind) {
    case 'Root': {
      const root = node as RootNode
      await visitor.root?.(root)
      for (const schema of root.schemas) await walk(schema, visitor)
      for (const operation of root.operations) await walk(operation, visitor)
      break
    }
    case 'Operation': {
      const op = node as OperationNode
      await visitor.operation?.(op)
      for (const param of op.parameters) await walk(param, visitor)
      if (op.requestBody) await walk(op.requestBody, visitor)
      for (const response of op.responses) await walk(response, visitor)
      break
    }
    case 'Schema': {
      const schema = node as SchemaNode
      await visitor.schema?.(schema)
      if ('properties' in schema && schema.properties) {
        for (const prop of schema.properties) await walk(prop, visitor)
      }
      if ('items' in schema && schema.items) {
        for (const item of schema.items) await walk(item, visitor)
      }
      if ('members' in schema && schema.members) {
        for (const member of schema.members) await walk(member, visitor)
      }
      break
    }
    case 'Property': {
      const prop = node as PropertyNode
      await visitor.property?.(prop)
      await walk(prop.schema, visitor)
      break
    }
    case 'Parameter': {
      const param = node as ParameterNode
      await visitor.parameter?.(param)
      await walk(param.schema, visitor)
      break
    }
    case 'Response': {
      const response = node as ResponseNode
      await visitor.response?.(response)
      if (response.schema) await walk(response.schema, visitor)
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
export function transform(node: Node, visitor: Visitor): Node {
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

/**
 * Traverses the AST rooted at `node` depth-first, collecting the non-`undefined`
 * return values of visitor methods into an array.
 *
 * Use `collect` when you need to **extract values** from the tree synchronously
 * (e.g. gathering all importable ref nodes). Unlike {@link walk} (async
 * side-effects) or {@link transform} (node replacement), `collect` is a pure
 * read-only, synchronous reduction.
 *
 * @example
 * ```ts
 * const refs = collect(root, {
 *   schema(node) {
 *     if (node.type === 'ref') return node
 *   },
 * })
 * ```
 */
export function collect<T>(node: Node, visitor: CollectVisitor<T>): Array<T> {
  const results: Array<T> = []

  switch (node.kind) {
    case 'Root': {
      const root = node as RootNode
      const v = visitor.root?.(root)
      if (v !== undefined) results.push(v)
      for (const schema of root.schemas) results.push(...collect(schema, visitor))
      for (const operation of root.operations) results.push(...collect(operation, visitor))
      break
    }
    case 'Operation': {
      const op = node as OperationNode
      const v = visitor.operation?.(op)
      if (v !== undefined) results.push(v)
      for (const param of op.parameters) results.push(...collect(param, visitor))
      if (op.requestBody) results.push(...collect(op.requestBody, visitor))
      for (const response of op.responses) results.push(...collect(response, visitor))
      break
    }
    case 'Schema': {
      const schema = node as SchemaNode
      const v = visitor.schema?.(schema)
      if (v !== undefined) results.push(v)
      if ('properties' in schema && schema.properties) {
        for (const prop of schema.properties) results.push(...collect(prop, visitor))
      }
      if ('items' in schema && schema.items) {
        for (const item of schema.items) results.push(...collect(item, visitor))
      }
      if ('members' in schema && schema.members) {
        for (const member of schema.members) results.push(...collect(member, visitor))
      }
      break
    }
    case 'Property': {
      const prop = node as PropertyNode
      const v = visitor.property?.(prop)
      if (v !== undefined) results.push(v)
      results.push(...collect(prop.schema, visitor))
      break
    }
    case 'Parameter': {
      const param = node as ParameterNode
      const v = visitor.parameter?.(param)
      if (v !== undefined) results.push(v)
      results.push(...collect(param.schema, visitor))
      break
    }
    case 'Response': {
      const response = node as ResponseNode
      const v = visitor.response?.(response)
      if (v !== undefined) results.push(v)
      if (response.schema) results.push(...collect(response.schema, visitor))
      break
    }
  }

  return results
}
