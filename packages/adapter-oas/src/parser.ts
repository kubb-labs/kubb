import { pascalCase } from '@internals/utils'
import { ast, type StatusCode } from '@kubb/ast'
import { DEFAULT_PARSER_OPTIONS } from './constants.ts'
import { type ConvertContext, schemaRules } from './emit/parseSchema.ts'
import { isNullable, isReference } from './oas.ts'
import { createRefs } from './refs.ts'
import { getOperationId, getRequestContentType, getResponseByStatusCode, getResponseStatusCodes } from './operation.ts'
import { flattenSchema, getParameters, getRequestBodyContentTypes, getRequestSchema, getResponseBodyContentTypes, getResponseSchema } from './resolvers.ts'
import type { ContentType, Document, Operation, SchemaObject } from './types.ts'

/**
 * Parser context holding the raw OpenAPI document and optional content-type override.
 *
 * Passed to schema and operation converters to access the full specification
 * and handle content negotiation when multiple media types are available.
 */
export type OasParserContext = {
  document: Document
  contentType?: ContentType
  /**
   * Collision renames from `getSchemas`, keyed by the original component pointer. `convertRef`
   * stamps `targetName` from it at ref creation, so refs to renamed schemas resolve to the
   * emitted name without a post-parse pass.
   */
  renames?: ReadonlyMap<string, string>
}

/**
 * Creates the schema and operation converters bound to one OpenAPI document.
 *
 * Owns the `$ref` service for this instance and the `parseSchema` recursion seam, then dispatches
 * each schema through the ordered `schemaRules` table from `emit/parseSchema.ts`. Every converter
 * is a standalone function that recurses through the `parse` function passed to it, so this file
 * only wires state to the converters.
 *
 * @internal
 */
export function createSchemaParser(ctx: OasParserContext) {
  const document = ctx.document
  const refs = createRefs(document)

  /**
   * Converts an OAS `SchemaObject` into a `SchemaNode`.
   *
   * Builds the per-schema context, then walks the ordered {@link schemaRules} table and returns
   * the first converter that produces a node. When none match, falls back to the configured
   * `emptySchemaType`.
   */
  function parseSchema({ schema, name }: { schema: SchemaObject; name?: string | null }, rawOptions?: Partial<ast.ParserOptions>): ast.SchemaNode {
    const options: ast.ParserOptions = {
      ...DEFAULT_PARSER_OPTIONS,
      ...rawOptions,
    }
    const flattenedSchema = flattenSchema(schema)
    if (flattenedSchema && flattenedSchema !== schema) {
      return parseSchema({ schema: flattenedSchema, name }, rawOptions)
    }

    const nullable = isNullable(schema) || undefined
    const defaultValue = schema.default === null && nullable ? undefined : schema.default
    const type = Array.isArray(schema.type) ? schema.type[0] : schema.type

    const context: ConvertContext = {
      schema,
      name,
      nullable,
      defaultValue,
      type,
      rawOptions,
      options,
      parse: parseSchema,
      document,
      refs,
      renames: ctx.renames,
    }

    for (const rule of schemaRules) {
      if (rule.match(context)) return rule.convert(context)
    }

    const emptyType = options.emptySchemaType
    return ast.factory.createSchema({
      type: emptyType as ast.ScalarSchemaType,
      name,
      title: schema.title,
      description: schema.description,
      format: schema.format,
    })
  }

  /**
   * Converts a dereferenced OAS parameter object into a `ParameterNode`.
   */
  function parseParameter(options: ast.ParserOptions, param: Record<string, unknown>, parentName?: string): ast.ParameterNode {
    const required = (param['required'] as boolean | undefined) ?? false
    const paramName = param['name'] as string
    const schemaName = parentName && paramName ? pascalCase(`${parentName} ${paramName}`) : undefined

    const schema: ast.SchemaNode = param['schema']
      ? parseSchema({ schema: param['schema'] as SchemaObject, name: schemaName }, options)
      : ast.factory.createSchema({ type: options.unknownType })

    const style = param['style'] as ast.ParameterStyle | undefined
    const explode = param['explode'] as boolean | undefined

    return ast.factory.createParameter({
      name: paramName,
      in: param['in'] as ast.ParameterLocation,
      schema: {
        ...schema,
        description: (param['description'] as string | undefined) ?? schema.description,
      },
      required,
      ...(style !== undefined ? { style } : {}),
      ...(explode !== undefined ? { explode } : {}),
    })
  }

  /**
   * Reads the inline `requestBody` metadata (description / required) that OAS exposes
   * outside the schema itself. Returns an empty object when the request body is missing or a `$ref`.
   */
  function getRequestBodyMeta(operation: Operation): {
    description?: string
    required: boolean
  } {
    const body = operation.schema.requestBody as { description?: string; required?: boolean } | undefined
    if (!body) return { required: false }

    // After getRequestBodyContentTypes has run, body may still carry $ref but the
    // resolved fields (description, required, content) are already spread onto it.
    return {
      description: body.description,
      required: body.required === true,
    }
  }

  /**
   * Collects property names whose schema has a truthy boolean flag (`readOnly` or `writeOnly`).
   * `$ref` entries are skipped since their flags live on the dereferenced target.
   */
  function collectPropertyKeysByFlag(schema: SchemaObject | null, flag: 'readOnly' | 'writeOnly'): Array<string> | null {
    if (!schema?.properties) return null

    const keys: Array<string> = []
    for (const key in schema.properties) {
      const prop = schema.properties[key]
      if (prop && !isReference(prop) && (prop as Record<string, unknown>)[flag]) {
        keys.push(key)
      }
    }
    return keys.length ? keys : null
  }

  /**
   * Converts an OAS `Operation` into an `OperationNode`.
   */
  function parseOperation(options: ast.ParserOptions, operation: Operation): ast.OperationNode {
    const operationId = getOperationId(operation)
    const operationName = operationId ? pascalCase(operationId) : undefined
    const parameters: Array<ast.ParameterNode> = getParameters(document, operation).map((param) =>
      parseParameter(options, param as unknown as Record<string, unknown>, operationName),
    )

    // Determine which content types to include in requestBody.content.
    // When a global contentType is configured, restrict to that single type.
    // Otherwise include every content type declared in the spec.
    const allContentTypes = ctx.contentType ? [ctx.contentType] : getRequestBodyContentTypes(document, operation)

    const requestBodyMeta = getRequestBodyMeta(operation)
    const requestBodyName = operationName ? `${operationName}Request` : undefined

    const content = allContentTypes.flatMap((ct) => {
      const schema = getRequestSchema(document, operation, { contentType: ct })
      if (!schema) return []
      return [
        ast.factory.createContent({
          contentType: ct,
          schema: ast.optionality(parseSchema({ schema, name: requestBodyName }, options), requestBodyMeta.required),
          keysToOmit: collectPropertyKeysByFlag(schema, 'readOnly'),
        }),
      ]
    })

    const requestBody =
      content.length > 0 || requestBodyMeta.description
        ? {
            description: requestBodyMeta.description,
            required: requestBodyMeta.required || undefined,
            content: content.length > 0 ? content : undefined,
          }
        : undefined

    const responses: Array<ast.ResponseNode> = getResponseStatusCodes(operation).map((statusCode) => {
      const responseObj = getResponseByStatusCode({ document, operation, statusCode })

      // Use `Status<code>` (matching plugin-ts's resolveResponseStatusName convention) so the
      // qualified names for nested enums don't collide with top-level component schemas that
      // happen to be named `<operation><statusCode>` (e.g. `GetMaintenance200`).
      const responseName = operationName ? `${operationName}Status${statusCode}` : undefined
      const description = typeof responseObj === 'object' && responseObj !== null ? (responseObj as { description?: string }).description : undefined

      const parseEntrySchema = (contentType?: string) => {
        const raw = getResponseSchema(document, operation, statusCode, { contentType })
        const node =
          raw && Object.keys(raw).length > 0
            ? parseSchema({ schema: raw, name: responseName }, options)
            : ast.factory.createSchema({ type: options.emptySchemaType })
        return { schema: node, keysToOmit: collectPropertyKeysByFlag(raw, 'writeOnly') }
      }

      // Build one entry per declared response content type so plugins can union the variants.
      // When a global contentType is configured, restrict to that single type (mirrors requestBody).
      const responseContentTypes = ctx.contentType ? [ctx.contentType] : getResponseBodyContentTypes(document, operation, statusCode)
      const content = responseContentTypes.map((contentType) => ast.factory.createContent({ contentType, ...parseEntrySchema(contentType) }))

      // Body-less responses keep a single fallback entry so the response still resolves to a
      // (void/any) schema, matching how `requestBody` only carries schemas inside `content`.
      if (content.length === 0) {
        content.push(
          ast.factory.createContent({
            contentType: getRequestContentType({ document, operation }) || 'application/json',
            ...parseEntrySchema(ctx.contentType),
          }),
        )
      }

      return ast.factory.createResponse({
        statusCode: statusCode as StatusCode,
        description,
        content,
      })
    })

    const pathItem = document.paths?.[operation.path]
    const pathItemDoc = pathItem && !isReference(pathItem) ? (pathItem as { summary?: unknown; description?: unknown }) : undefined
    const pickDoc = (key: 'summary' | 'description'): string | undefined => {
      const own = operation.schema[key]
      if (typeof own === 'string') return own
      const fallback = pathItemDoc?.[key]
      return typeof fallback === 'string' ? fallback : undefined
    }

    return ast.factory.createOperation({
      operationId,
      protocol: 'http',
      method: operation.method.toUpperCase() as ast.HttpMethod,
      path: operation.path,
      tags: Array.isArray(operation.schema.tags) ? operation.schema.tags.map(String) : [],
      summary: pickDoc('summary') || undefined,
      description: pickDoc('description') || undefined,
      deprecated: operation.schema.deprecated || undefined,
      parameters,
      requestBody,
      responses,
    })
  }

  return { parseSchema, parseOperation, parseParameter }
}
