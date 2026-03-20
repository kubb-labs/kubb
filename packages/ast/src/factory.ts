import type { ObjectSchemaNode, OperationNode, ParameterNode, PropertyNode, ResponseNode, RootNode, SchemaNode } from './nodes/index.ts'

/**
 * Distributive variant of `Omit` that preserves union members.
 */
export type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never

/**
 * Creates a `RootNode`.
 */
export function createRoot(overrides: Partial<Omit<RootNode, 'kind'>> = {}): RootNode {
  return {
    schemas: [],
    operations: [],
    ...overrides,
    kind: 'Root',
  }
}

/**
 * Creates an `OperationNode`.
 */
export function createOperation(
  props: Pick<OperationNode, 'operationId' | 'method' | 'path'> & Partial<Omit<OperationNode, 'kind' | 'operationId' | 'method' | 'path'>>,
): OperationNode {
  return {
    tags: [],
    parameters: [],
    responses: [],
    ...props,
    kind: 'Operation',
  }
}

/**
 * Creates a `SchemaNode`, narrowed to the variant of `props.type`.
 * For object schemas, `properties` defaults to `[]` when not provided.
 */
export function createSchema<T extends Omit<ObjectSchemaNode, 'kind' | 'properties'> & { properties?: Array<PropertyNode> }>(
  props: T,
): Omit<T, 'properties'> & { properties: Array<PropertyNode>; kind: 'Schema' }
export function createSchema<T extends DistributiveOmit<Exclude<SchemaNode, ObjectSchemaNode>, 'kind'>>(props: T): T & { kind: 'Schema' }
export function createSchema(props: DistributiveOmit<SchemaNode, 'kind'>): SchemaNode
export function createSchema(props: Record<string, unknown>): Record<string, unknown> {
  if (props['type'] === 'object') {
    return { properties: [], ...props, kind: 'Schema' }
  }

  return { ...props, kind: 'Schema' }
}

/**
 * Creates a `PropertyNode`. `required` defaults to `false`.
 */
export function createProperty(props: Pick<PropertyNode, 'name' | 'schema'> & Partial<Omit<PropertyNode, 'kind' | 'name' | 'schema'>>): PropertyNode {
  return {
    required: false,
    ...props,
    kind: 'Property',
  }
}

/**
 * Creates a `ParameterNode`. `required` defaults to `false`.
 */
export function createParameter(
  props: Pick<ParameterNode, 'name' | 'in' | 'schema'> & Partial<Omit<ParameterNode, 'kind' | 'name' | 'in' | 'schema'>>,
): ParameterNode {
  return {
    required: false,
    ...props,
    kind: 'Parameter',
  }
}

/**
 * Creates a `ResponseNode`.
 */
export function createResponse(
  props: Pick<ResponseNode, 'statusCode' | 'schema'> & Partial<Omit<ResponseNode, 'kind' | 'statusCode' | 'schema'>>,
): ResponseNode {
  return {
    ...props,
    kind: 'Response',
  }
}
