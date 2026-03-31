import { jsStringEscape, stringify } from '@internals/utils'
import { createProperty, createSchema, syncSchemaRef } from '@kubb/ast'
import type { OperationNode, ParameterNode, SchemaNode } from '@kubb/ast/types'
import type { ResolverTs } from './types.ts'

/**
 * Collects JSDoc annotation strings for a schema node.
 *
 * Only uses official JSDoc tags from https://jsdoc.app/: `@description`, `@deprecated`, `@default`, `@example`, `@type`.
 * Constraint metadata (min/max length, pattern, multipleOf, min/maxProperties) is emitted as plain-text lines.

 */
export function buildPropertyJSDocComments(schema: SchemaNode): Array<string | undefined> {
  const meta = syncSchemaRef(schema)

  const isArray = meta?.primitive === 'array'

  return [
    meta && 'description' in meta && meta.description ? `@description ${jsStringEscape(meta.description)}` : undefined,
    meta && 'deprecated' in meta && meta.deprecated ? '@deprecated' : undefined,
    // minItems/maxItems on arrays should not be emitted as @minLength/@maxLength
    !isArray && meta && 'min' in meta && meta.min !== undefined ? `@minLength ${meta.min}` : undefined,
    !isArray && meta && 'max' in meta && meta.max !== undefined ? `@maxLength ${meta.max}` : undefined,
    meta && 'pattern' in meta && meta.pattern ? `@pattern ${meta.pattern}` : undefined,
    meta && 'default' in meta && meta.default !== undefined
      ? `@default ${'primitive' in meta && meta.primitive === 'string' ? stringify(meta.default as string) : meta.default}`
      : undefined,
    meta && 'example' in meta && meta.example !== undefined ? `@example ${meta.example}` : undefined,
    meta && 'primitive' in meta && meta.primitive
      ? [`@type ${meta.primitive}`, 'optional' in schema && schema.optional ? ' | undefined' : undefined].filter(Boolean).join('')
      : undefined,
  ].filter(Boolean)
}

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
          ? createSchema({ type: 'ref', name: resolver.resolveDataName(node), optional: true })
          : createSchema({ type: 'never', primitive: undefined, optional: true }),
      }),
      createProperty({
        name: 'pathParams',
        required: pathParams.length > 0,
        schema: pathParams.length > 0 ? buildParams({ params: pathParams, node, resolver }) : createSchema({ type: 'never', primitive: undefined }),
      }),
      createProperty({
        name: 'queryParams',
        schema:
          queryParams.length > 0
            ? createSchema({ ...buildParams({ params: queryParams, node, resolver }), optional: true })
            : createSchema({ type: 'never', primitive: undefined, optional: true }),
      }),
      createProperty({
        name: 'headerParams',
        schema:
          headerParams.length > 0
            ? createSchema({ ...buildParams({ params: headerParams, node, resolver }), optional: true })
            : createSchema({ type: 'never', primitive: undefined, optional: true }),
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
        schema: createSchema({ type: 'ref', name: resolver.resolveResponseStatusName(node, res.statusCode) }),
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
    members: responsesWithSchema.map((res) => createSchema({ type: 'ref', name: resolver.resolveResponseStatusName(node, res.statusCode) })),
  })
}
