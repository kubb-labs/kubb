import { createProperty, createSchema } from '@kubb/ast'
import { defineBuilder } from '@kubb/core'
import type { PluginTs } from '../types.ts'

/**
 * Default schema builder for `@kubb/plugin-ts`.
 *
 * Implements the `buildParams`, `buildData`, `buildResponses`, and `buildResponseUnion` helpers
 * used by the TypeScript type generator to construct AST schema nodes for operation parameters,
 * request bodies, and responses.
 *
 * @example
 * ```ts
 * import { builderTs } from '@kubb/plugin-ts'
 *
 * builderTs.buildData({ node, resolver })
 * // → object schema with pathParams, queryParams, headerParams, data, url properties
 * ```
 */
export const builderTs = defineBuilder<PluginTs>(() => ({
  name: 'default',
  buildParams({ params, node, resolver }) {
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
  },
  buildData({ node, resolver }) {
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
          schema: pathParams.length > 0 ? this.buildParams({ params: pathParams, node, resolver }) : createSchema({ type: 'never' }),
        }),
        createProperty({
          name: 'queryParams',
          schema:
            queryParams.length > 0
              ? createSchema({ ...this.buildParams({ params: queryParams, node, resolver }), optional: true })
              : createSchema({ type: 'never', optional: true }),
        }),
        createProperty({
          name: 'headerParams',
          schema:
            headerParams.length > 0
              ? createSchema({ ...this.buildParams({ params: headerParams, node, resolver }), optional: true })
              : createSchema({ type: 'never', optional: true }),
        }),
        createProperty({
          name: 'url',
          required: true,
          schema: createSchema({ type: 'url', path: node.path }),
        }),
      ],
    })
  },
  buildResponses({ node, resolver }) {
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
  },
  buildResponseUnion({ node, resolver }) {
    const responsesWithSchema = node.responses.filter((res) => res.schema)

    if (responsesWithSchema.length === 0) {
      return null
    }

    return createSchema({
      type: 'union',
      members: responsesWithSchema.map((res) => createSchema({ type: 'ref', name: resolver.resolveResponseStatusTypedName(node, res.statusCode) })),
    })
  },
}))
