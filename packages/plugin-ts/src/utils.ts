import { createProperty, createSchema } from '@kubb/ast'
import type { ParameterNode, SchemaNode } from '@kubb/ast/types'
import type { OperationNode } from '@kubb/ast/types'
import type { ResolverTs } from './types.ts'

type BuildParamsSchemaOptions = {
  params: Array<ParameterNode>
  node: OperationNode
  resolver: ResolverTs
}

type BuildOperationSchemaOptions = {
  node: OperationNode
  resolver: ResolverTs
}

export function buildParams({ params, node, resolver }: BuildParamsSchemaOptions): SchemaNode {
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

export function buildData({ node, resolver }: BuildOperationSchemaOptions): SchemaNode {
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
          ? createSchema({ type: 'ref', name: resolver.resolveDataTypedName(node), optional: true })
          : createSchema({ type: 'never', optional: true }),
      }),
      createProperty({
        name: 'pathParams',
        required: pathParams.length > 0,
        schema: pathParams.length > 0 ? buildParams({ params: pathParams, node, resolver }) : createSchema({ type: 'never' }),
      }),
      createProperty({
        name: 'queryParams',
        schema:
          queryParams.length > 0
            ? createSchema({ ...buildParams({ params: queryParams, node, resolver }), optional: true })
            : createSchema({ type: 'never', optional: true }),
      }),
      createProperty({
        name: 'headerParams',
        schema:
          headerParams.length > 0
            ? createSchema({ ...buildParams({ params: headerParams, node, resolver }), optional: true })
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

export function buildResponses({ node, resolver }: BuildOperationSchemaOptions): SchemaNode | null {
  if (node.responses.length === 0) {
    return null
  }

  return createSchema({
    type: 'object',
    properties: node.responses.map((res) =>
      createProperty({
        name: String(res.statusCode),
        required: true,
        schema: createSchema({ type: 'ref', name: resolver.resolveResponseStatusTypedName(node, res.statusCode) }),
      }),
    ),
  })
}

export function buildResponseUnion({ node, resolver }: BuildOperationSchemaOptions): SchemaNode | null {
  const responsesWithSchema = node.responses.filter((res) => res.schema)

  if (responsesWithSchema.length === 0) {
    return null
  }

  return createSchema({
    type: 'union',
    members: responsesWithSchema.map((res) => createSchema({ type: 'ref', name: resolver.resolveResponseStatusTypedName(node, res.statusCode) })),
  })
}
