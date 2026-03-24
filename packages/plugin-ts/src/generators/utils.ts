import { pascalCase } from '@internals/utils'
import { createProperty, createSchema, narrowSchema, transform } from '@kubb/ast'
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
        required: param.required,
        schema: createSchema({
          type: 'ref',
          name: resolver.resolveParamName(node, param),
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
        schema: node.requestBody?.schema
          ? createSchema({
              type: 'ref',
              name: resolver.resolveDataTypedName(node),
              optional: true,
            })
          : createSchema({ type: 'never', optional: true }),
      }),
      createProperty({
        name: 'pathParams',
        required: pathParams.length > 0,
        schema: pathParams.length > 0 ? buildParamsSchema({ params: pathParams, node, resolver }) : createSchema({ type: 'never' }),
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
        required: true,
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
        required: true,
        schema: createSchema({
          type: 'ref',
          name: resolver.resolveResponseStatusTypedName(node, res.statusCode),
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
        name: resolver.resolveResponseStatusTypedName(node, res.statusCode),
      }),
    ),
  })
}

type BuildGroupedParamsSchemaOptions = {
  params: Array<ParameterNode>
  /**
   * Parent type name (e.g. `FindPetsByStatusQueryParams`) used to derive enum names
   * for inline enum properties (e.g. `FindPetsByStatusQueryParamsStatusEnum`).
   */
  parentName?: string
}

/**
 * Builds an `ObjectSchemaNode` for a grouped parameters type (path/query/header) in legacy mode.
 * Each property directly embeds the parameter's schema inline (not a ref).
 * Used to generate `<OperationId>PathParams`, `<OperationId>QueryParams`, `<OperationId>HeaderParams`.
 * @deprecated Legacy only — will be removed in v6.
 */
export function buildGroupedParamsSchema({ params, parentName }: BuildGroupedParamsSchemaOptions): SchemaNode {
  return createSchema({
    type: 'object',
    properties: params.map((param) => {
      let schema = param.schema
      if (narrowSchema(schema, 'enum') && !schema.name && parentName) {
        schema = { ...schema, name: pascalCase([parentName, param.name, 'enum'].join(' ')) }
      }
      return createProperty({
        name: param.name,
        required: param.required,
        schema,
      })
    }),
  })
}

/**
 * Builds the legacy wrapper `ObjectSchemaNode` for `<OperationId>Mutation` / `<OperationId>Query`.
 * Structure: `{ Response, Request?, QueryParams?, PathParams?, HeaderParams?, Errors }`.
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
        ? createSchema({ type: 'ref', name: resolver.resolveResponseStatusTypedName(node, successResponses[0]!.statusCode) })
        : createSchema({
            type: 'union',
            members: successResponses.map((res) => createSchema({ type: 'ref', name: resolver.resolveResponseStatusTypedName(node, res.statusCode) })),
          })
      : createSchema({ type: 'any' })

  const errorsSchema =
    errorResponses.length > 0
      ? errorResponses.length === 1
        ? createSchema({ type: 'ref', name: resolver.resolveResponseStatusTypedName(node, errorResponses[0]!.statusCode) })
        : createSchema({
            type: 'union',
            members: errorResponses.map((res) => createSchema({ type: 'ref', name: resolver.resolveResponseStatusTypedName(node, res.statusCode) })),
          })
      : createSchema({ type: 'any' })

  const properties = [createProperty({ name: 'Response', required: true, schema: responseSchema })]

  if (!isGet && node.requestBody?.schema) {
    properties.push(
      createProperty({
        name: 'Request',
        required: true,
        schema: createSchema({ type: 'ref', name: resolver.resolveDataTypedName(node) }),
      }),
    )
  }

  if (node.parameters.some((p) => p.in === 'query') && resolver.resolveQueryParamsTypedName) {
    properties.push(
      createProperty({
        name: 'QueryParams',
        required: true,
        schema: createSchema({ type: 'ref', name: resolver.resolveQueryParamsTypedName(node) }),
      }),
    )
  }

  if (node.parameters.some((p) => p.in === 'path') && resolver.resolvePathParamsTypedName) {
    properties.push(
      createProperty({
        name: 'PathParams',
        required: true,
        schema: createSchema({ type: 'ref', name: resolver.resolvePathParamsTypedName(node) }),
      }),
    )
  }

  if (node.parameters.some((p) => p.in === 'header') && resolver.resolveHeaderParamsTypedName) {
    properties.push(
      createProperty({
        name: 'HeaderParams',
        required: true,
        schema: createSchema({ type: 'ref', name: resolver.resolveHeaderParamsTypedName(node) }),
      }),
    )
  }

  properties.push(createProperty({ name: 'Errors', required: true, schema: errorsSchema }))

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
    return createSchema({ type: 'ref', name: resolver.resolveResponseStatusTypedName(node, successResponses[0]!.statusCode) })
  }

  return createSchema({
    type: 'union',
    members: successResponses.map((res) => createSchema({ type: 'ref', name: resolver.resolveResponseStatusTypedName(node, res.statusCode) })),
  })
}

/**
 * Names unnamed enum nodes within a schema tree based on the parent type name.
 * Used in legacy mode to ensure inline enums in response/request schemas get
 * extracted as named enum declarations (e.g. `DeletePet200Enum`).
 *
 * @deprecated Legacy only — will be removed in v6.
 */
export function nameUnnamedEnums(node: SchemaNode, parentName: string): SchemaNode {
  return transform(node, {
    schema(n) {
      const enumNode = narrowSchema(n, 'enum')
      if (enumNode && !enumNode.name) {
        return { ...enumNode, name: pascalCase([parentName, 'enum'].join(' ')) }
      }
      return undefined
    },
    property(p) {
      const enumNode = narrowSchema(p.schema, 'enum')
      if (enumNode && !enumNode.name) {
        return {
          ...p,
          schema: { ...enumNode, name: pascalCase([parentName, p.name, 'enum'].join(' ')) },
        }
      }
      return undefined
    },
  })
}
