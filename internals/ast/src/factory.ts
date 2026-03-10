import type { OperationNode } from './nodes/operation.ts'
import type { ParameterNode } from './nodes/parameter.ts'
import type { PropertyNode } from './nodes/property.ts'
import type { ResponseNode } from './nodes/response.ts'
import type { RootNode } from './nodes/root.ts'
import type { SchemaNode } from './nodes/schema.ts'

/**
 * Creates a `RootNode` with sensible defaults.
 * Overrides can be supplied to populate schemas and operations immediately.
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
 * `operationId`, `method`, and `path` are required; all other fields default
 * to empty / `undefined`.
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
 * Creates a `SchemaNode`.
 * `type` is required; all other fields are optional.
 */
export function createSchema(
  props: Pick<SchemaNode, 'type'> & Partial<Omit<SchemaNode, 'kind' | 'type'>>,
): SchemaNode {
  return {
    ...props,
    kind: 'Schema',
  }
}

/**
 * Creates a `PropertyNode`.
 * `name` and `schema` are required; `required` defaults to `false`.
 */
export function createProperty(
  props: Pick<PropertyNode, 'name' | 'schema'> & Partial<Omit<PropertyNode, 'kind' | 'name' | 'schema'>>,
): PropertyNode {
  return {
    required: false,
    ...props,
    kind: 'Property',
  }
}

/**
 * Creates a `ParameterNode`.
 * `name`, `in`, and `schema` are required; `required` defaults to `false`.
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
 * `statusCode` is required; all other fields are optional.
 */
export function createResponse(
  props: Pick<ResponseNode, 'statusCode'> & Partial<Omit<ResponseNode, 'kind' | 'statusCode'>>,
): ResponseNode {
  return {
    ...props,
    kind: 'Response',
  }
}
