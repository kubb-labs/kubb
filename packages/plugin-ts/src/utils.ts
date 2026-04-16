import { jsStringEscape, stringify } from '@internals/utils'
import type { Ast } from '@kubb/core'
import { ast } from '@kubb/core'
import type { ResolverTs } from './types.ts'

/**
 * Collects JSDoc annotation strings for a schema node.
 *
 * Only uses official JSDoc tags from https://jsdoc.app/: `@description`, `@deprecated`, `@default`, `@example`, `@type`.
 * Constraint metadata (min/max length, pattern, multipleOf, min/maxProperties) is emitted as plain-text lines.

 */
export function buildPropertyJSDocComments(schema: Ast.SchemaNode): Array<string | undefined> {
  const meta = ast.syncSchemaRef(schema)

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
  params: Array<Ast.ParameterNode>
  resolver: ResolverTs
}

type BuildOperationSchemaOptions = {
  resolver: ResolverTs
}

export function buildParams(node: Ast.OperationNode, { params, resolver }: BuildParamsSchemaOptions): Ast.SchemaNode {
  return ast.createSchema({
    type: 'object',
    properties: params.map((param) =>
      ast.createProperty({
        name: param.name,
        required: param.required,
        schema: ast.createSchema({
          type: 'ref',
          name: resolver.resolveParamName(node, param),
        }),
      }),
    ),
  })
}

export function buildData(node: Ast.OperationNode, { resolver }: BuildOperationSchemaOptions): Ast.SchemaNode {
  const pathParams = node.parameters.filter((p) => p.in === 'path')
  const queryParams = node.parameters.filter((p) => p.in === 'query')
  const headerParams = node.parameters.filter((p) => p.in === 'header')

  return ast.createSchema({
    type: 'object',
    deprecated: node.deprecated,
    properties: [
      ast.createProperty({
        name: 'data',
        schema: node.requestBody?.schema
          ? ast.createSchema({ type: 'ref', name: resolver.resolveDataName(node), optional: true })
          : ast.createSchema({ type: 'never', primitive: undefined, optional: true }),
      }),
      ast.createProperty({
        name: 'pathParams',
        required: pathParams.length > 0,
        schema: pathParams.length > 0 ? buildParams(node, { params: pathParams, resolver }) : ast.createSchema({ type: 'never', primitive: undefined }),
      }),
      ast.createProperty({
        name: 'queryParams',
        schema:
          queryParams.length > 0
            ? ast.createSchema({ ...buildParams(node, { params: queryParams, resolver }), optional: true })
            : ast.createSchema({ type: 'never', primitive: undefined, optional: true }),
      }),
      ast.createProperty({
        name: 'headerParams',
        schema:
          headerParams.length > 0
            ? ast.createSchema({ ...buildParams(node, { params: headerParams, resolver }), optional: true })
            : ast.createSchema({ type: 'never', primitive: undefined, optional: true }),
      }),
      ast.createProperty({
        name: 'url',
        required: true,
        schema: ast.createSchema({ type: 'url', path: node.path }),
      }),
    ],
  })
}

export function buildResponses(node: Ast.OperationNode, { resolver }: BuildOperationSchemaOptions): Ast.SchemaNode | null {
  if (node.responses.length === 0) {
    return null
  }

  return ast.createSchema({
    type: 'object',
    properties: node.responses.map((res) =>
      ast.createProperty({
        name: String(res.statusCode),
        required: true,
        schema: ast.createSchema({ type: 'ref', name: resolver.resolveResponseStatusName(node, res.statusCode) }),
      }),
    ),
  })
}

export function buildResponseUnion(node: Ast.OperationNode, { resolver }: BuildOperationSchemaOptions): Ast.SchemaNode | null {
  const responsesWithSchema = node.responses.filter((res) => res.schema)

  if (responsesWithSchema.length === 0) {
    return null
  }

  return ast.createSchema({
    type: 'union',
    members: responsesWithSchema.map((res) => ast.createSchema({ type: 'ref', name: resolver.resolveResponseStatusName(node, res.statusCode) })),
  })
}
