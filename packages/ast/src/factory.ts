import type { OperationNode, ParameterNode, PropertyNode, ResponseNode, RootNode, SchemaNode } from './nodes/index.ts'

/**
 * Distributive variant of `Omit` that preserves union members.
 */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never

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
 */
export function createSchema<T extends DistributiveOmit<SchemaNode, 'kind'>>(props: T): T & { kind: 'Schema' } {
  return { ...props, kind: 'Schema' } as T & { kind: 'Schema' }
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
export function createResponse(props: Pick<ResponseNode, 'statusCode'> & Partial<Omit<ResponseNode, 'kind' | 'statusCode'>>): ResponseNode {
  return {
    ...props,
    kind: 'Response',
  }
}
