import { pascalCase } from '@internals/utils'
import { createProperty, createSchema } from '@kubb/ast'
import type { OperationNode, ParameterNode, SchemaNode } from '@kubb/ast/types'

type ResolveName = (opts: { name: string; type: 'type' | 'function' }) => string

type BuildParamsSchemaOptions = {
  params: Array<ParameterNode>
  operationId: string
  resolveName: ResolveName
}

/**
 * Builds an `ObjectSchemaNode` for a group of parameters (path/query/header).
 * Each property is a `ref` schema pointing to the individually-resolved parameter type.
 * The ref name includes the parameter location so generated type names follow
 * the `<OperationId><Location><ParamName>` convention.
 */
export function buildParamsSchema({ params, operationId, resolveName }: BuildParamsSchemaOptions): SchemaNode {
  return createSchema({
    type: 'object',
    properties: params.map((param) =>
      createProperty({
        name: param.name,
        schema: createSchema({
          type: 'ref',
          name: resolveName({ name: `${operationId} ${pascalCase(param.in)} ${param.name}`, type: 'function' }),
          optional: !param.required,
        }),
      }),
    ),
  })
}

type BuildOperationSchemaOptions = {
  node: OperationNode
  resolveName: ResolveName
}

/**
 * Builds an `ObjectSchemaNode` representing the `<OperationId>RequestConfig` type:
 * - `data`         → request body ref (optional) or `never`
 * - `pathParams`   → inline object of path param refs, or `never`
 * - `queryParams`  → inline object of query param refs (optional), or `never`
 * - `headerParams` → inline object of header param refs (optional), or `never`
 * - `url`          → Express-style template literal (plugin-ts extension, handled by printer)
 */
export function buildDataSchemaNode({ node, resolveName }: BuildOperationSchemaOptions): SchemaNode {
  const pathParams = node.parameters.filter((p) => p.in === 'path')
  const queryParams = node.parameters.filter((p) => p.in === 'query')
  const headerParams = node.parameters.filter((p) => p.in === 'header')

  return createSchema({
    type: 'object',
    deprecated: node.deprecated,
    properties: [
      createProperty({
        name: 'data',
        schema: node.requestBody
          ? createSchema({
              type: 'ref',
              name: resolveName({ name: `${node.operationId} Data`, type: 'function' }),
              optional: true,
            })
          : createSchema({ type: 'never', optional: true }),
      }),
      createProperty({
        name: 'pathParams',
        schema:
          pathParams.length > 0
            ? buildParamsSchema({ params: pathParams, operationId: node.operationId, resolveName })
            : createSchema({ type: 'never', optional: true }),
      }),
      createProperty({
        name: 'queryParams',
        schema:
          queryParams.length > 0
            ? createSchema({ ...buildParamsSchema({ params: queryParams, operationId: node.operationId, resolveName }), optional: true })
            : createSchema({ type: 'never', optional: true }),
      }),
      createProperty({
        name: 'headerParams',
        schema:
          headerParams.length > 0
            ? createSchema({ ...buildParamsSchema({ params: headerParams, operationId: node.operationId, resolveName }), optional: true })
            : createSchema({ type: 'never', optional: true }),
      }),
      createProperty({
        name: 'url',
        schema: createSchema({ type: 'url', path: node.path }),
      }),
    ],
  })
}

/**
 * Builds an `ObjectSchemaNode` representing `<OperationId>Responses` — keyed by HTTP status code.
 * Numeric status codes produce unquoted numeric keys (e.g. `200:`).
 * All responses are included; those without a schema are represented as a ref to a `never` type.
 */
export function buildResponsesSchemaNode({ node, resolveName }: BuildOperationSchemaOptions): SchemaNode | null {
  if (node.responses.length === 0) {
    return null
  }

  return createSchema({
    type: 'object',
    properties: node.responses.map((res) =>
      createProperty({
        name: String(res.statusCode),
        schema: createSchema({
          type: 'ref',
          name: resolveName({ name: `${node.operationId} Status ${res.statusCode}`, type: 'function' }),
        }),
      }),
    ),
  })
}

/**
 * Builds a `UnionSchemaNode` representing `<OperationId>Response` — all response types in union format.
 * Returns `null` when the operation has no responses with schemas.
 */
export function buildResponseUnionSchemaNode({ node, resolveName }: BuildOperationSchemaOptions): SchemaNode | null {
  const responsesWithSchema = node.responses.filter((res) => res.schema)

  if (responsesWithSchema.length === 0) {
    return null
  }

  return createSchema({
    type: 'union',
    members: responsesWithSchema.map((res) =>
      createSchema({
        type: 'ref',
        name: resolveName({ name: `${node.operationId} Status ${res.statusCode}`, type: 'function' }),
      }),
    ),
  })
}
