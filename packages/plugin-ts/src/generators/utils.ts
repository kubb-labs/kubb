import { createProperty, createSchema } from '@kubb/ast'
import type { OperationNode, ParameterNode, SchemaNode } from '@kubb/ast/types'
import type { ResolverTs } from '../types.ts'

type BuildParamsSchemaOptions = {
  params: Array<ParameterNode>
  node: OperationNode
  resolver: ResolverTs
}

/**
 * Builds an `ObjectSchemaNode` for a group of parameters (path/query/header).
 * Each property is a `ref` schema pointing to the individually-resolved parameter type.
 * The ref name includes the parameter location so generated type names follow
 * the `<OperationId><Location><ParamName>` convention.
 */
export function buildParamsSchema({ params, node, resolver }: BuildParamsSchemaOptions): SchemaNode {
  return createSchema({
    type: 'object',
    properties: params.map((param) =>
      createProperty({
        name: param.name,
        schema: createSchema({
          type: 'ref',
          name: resolver.resolveParamName(node, param),
          optional: !param.required,
        }),
      }),
    ),
  })
}

type BuildOperationSchemaOptions = {
  node: OperationNode
  resolver: ResolverTs
}

/**
 * Builds an `ObjectSchemaNode` representing the `<OperationId>RequestConfig` type:
 * - `data`         → request body ref (optional) or `never`
 * - `pathParams`   → inline object of path param refs, or `never`
 * - `queryParams`  → inline object of query param refs (optional), or `never`
 * - `headerParams` → inline object of header param refs (optional), or `never`
 * - `url`          → Express-style template literal (plugin-ts extension, handled by printer)
 */
export function buildDataSchemaNode({ node, resolver }: BuildOperationSchemaOptions): SchemaNode {
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
              name: resolver.resolveDataName(node),
              optional: true,
            })
          : createSchema({ type: 'never', optional: true }),
      }),
      createProperty({
        name: 'pathParams',
        schema: pathParams.length > 0 ? buildParamsSchema({ params: pathParams, node, resolver }) : createSchema({ type: 'never', optional: true }),
      }),
      createProperty({
        name: 'queryParams',
        schema:
          queryParams.length > 0
            ? createSchema({ ...buildParamsSchema({ params: queryParams, node, resolver }), optional: true })
            : createSchema({ type: 'never', optional: true }),
      }),
      createProperty({
        name: 'headerParams',
        schema:
          headerParams.length > 0
            ? createSchema({ ...buildParamsSchema({ params: headerParams, node, resolver }), optional: true })
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
export function buildResponsesSchemaNode({ node, resolver }: BuildOperationSchemaOptions): SchemaNode | null {
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
          name: resolver.resolveResponseStatusName(node, res.statusCode),
        }),
      }),
    ),
  })
}

/**
 * Builds a `UnionSchemaNode` representing `<OperationId>Response` — all response types in union format.
 * Returns `null` when the operation has no responses with schemas.
 */
export function buildResponseUnionSchemaNode({ node, resolver }: BuildOperationSchemaOptions): SchemaNode | null {
  const responsesWithSchema = node.responses.filter((res) => res.schema)

  if (responsesWithSchema.length === 0) {
    return null
  }

  return createSchema({
    type: 'union',
    members: responsesWithSchema.map((res) =>
      createSchema({
        type: 'ref',
        name: resolver.resolveResponseStatusName(node, res.statusCode),
      }),
    ),
  })
}

type BuildGroupedParamsSchemaOptions = {
  params: Array<ParameterNode>
}

/**
 * Builds an `ObjectSchemaNode` for a grouped parameters type (path/query/header) in legacy mode.
 * Each property directly embeds the parameter's schema inline (not a ref).
 * Used to generate `<OperationId>PathParams`, `<OperationId>QueryParams`, `<OperationId>HeaderParams`.
 * @deprecated Legacy only — will be removed in v6.
 */
export function buildGroupedParamsSchema({ params }: BuildGroupedParamsSchemaOptions): SchemaNode {
  return createSchema({
    type: 'object',
    properties: params.map((param) =>
      createProperty({
        name: param.name,
        schema: { ...param.schema, optional: !param.required },
      }),
    ),
  })
}

/**
 * Builds the legacy wrapper `ObjectSchemaNode` for `<OperationId>Mutation` / `<OperationId>Query`.
 * Structure: `{ Response, Request (mutation) | QueryParams (query), Errors }`.
 * Mirrors the v4 naming convention where this type acts as a namespace for the operation's shapes.
 *
 * @deprecated Legacy only — will be removed in v6.
 */
export function buildLegacyResponsesSchemaNode({ node, resolver }: BuildOperationSchemaOptions): SchemaNode | null {
  const isGet = node.method.toLowerCase() === 'get'
  const successResponses = node.responses.filter((res) => {
    const code = Number(res.statusCode)
    return !Number.isNaN(code) && code >= 200 && code < 300
  })
  const errorResponses = node.responses.filter((res) => res.statusCode === 'default' || Number(res.statusCode) >= 400)

  const responseSchema =
    successResponses.length > 0
      ? successResponses.length === 1
        ? createSchema({ type: 'ref', name: resolver.resolveResponseStatusName(node, successResponses[0]!.statusCode) })
        : createSchema({
            type: 'union',
            members: successResponses.map((res) => createSchema({ type: 'ref', name: resolver.resolveResponseStatusName(node, res.statusCode) })),
          })
      : createSchema({ type: 'any' })

  const errorsSchema =
    errorResponses.length > 0
      ? errorResponses.length === 1
        ? createSchema({ type: 'ref', name: resolver.resolveResponseStatusName(node, errorResponses[0]!.statusCode) })
        : createSchema({
            type: 'union',
            members: errorResponses.map((res) => createSchema({ type: 'ref', name: resolver.resolveResponseStatusName(node, res.statusCode) })),
          })
      : createSchema({ type: 'any' })

  const properties = [createProperty({ name: 'Response', schema: responseSchema })]

  if (!isGet && node.requestBody) {
    properties.push(
      createProperty({
        name: 'Request',
        schema: createSchema({ type: 'ref', name: resolver.resolveDataName(node) }),
      }),
    )
  } else if (isGet && node.parameters.some((p) => p.in === 'query')) {
    properties.push(
      createProperty({
        name: 'QueryParams',
        schema: createSchema({ type: 'ref', name: resolver.resolveQueryParamsName!(node) }),
      }),
    )
  }

  properties.push(createProperty({ name: 'Errors', schema: errorsSchema }))

  return createSchema({ type: 'object', properties })
}

/**
 * Builds the legacy response union for `<OperationId>MutationResponse` / `<OperationId>QueryResponse`.
 * In legacy mode this is the **success** response only (not the full union including errors).
 * Returns an `any` schema when there is no success response, matching v4 behavior.
 * @deprecated Legacy only — will be removed in v6.
 */
export function buildLegacyResponseUnionSchemaNode({ node, resolver }: BuildOperationSchemaOptions): SchemaNode {
  const successResponses = node.responses.filter((res) => {
    const code = Number(res.statusCode)
    return !Number.isNaN(code) && code >= 200 && code < 300
  })

  if (successResponses.length === 0) {
    return createSchema({ type: 'any' })
  }

  if (successResponses.length === 1) {
    return createSchema({ type: 'ref', name: resolver.resolveResponseStatusName(node, successResponses[0]!.statusCode) })
  }

  return createSchema({
    type: 'union',
    members: successResponses.map((res) => createSchema({ type: 'ref', name: resolver.resolveResponseStatusName(node, res.statusCode) })),
  })
}
