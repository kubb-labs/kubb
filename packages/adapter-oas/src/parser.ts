import type { ast } from '@kubb/kit'
import { DEFAULT_PARSER_OPTIONS } from './constants.ts'
import { createNode } from './emit/createNode.ts'
import { type ConvertContext, schemaRules } from './emit/parseSchema.ts'
import { flattenSchema } from './emit/schemaShape.ts'
import { isNullable } from './oas.ts'
import type { Refs } from './refs.ts'
import type { Document, SchemaObject } from './types.ts'

/**
 * Parser context holding the raw OpenAPI document and its `$ref` service.
 */
export type OasParserContext = {
  document: Document
  refs: Refs
  /**
   * Collision renames from `getSchemas`, keyed by the original component pointer. `convertRef`
   * stamps `targetName` from it at ref creation, so refs to renamed schemas resolve to the
   * emitted name without a post-parse pass.
   */
  renames?: ReadonlyMap<string, string>
  /**
   * Parser options, merged over `DEFAULT_PARSER_OPTIONS` once per parser instance.
   */
  options?: Partial<ast.ParserOptions>
}

/**
 * Creates the schema converter bound to one OpenAPI document.
 *
 * Owns the `parseSchema` recursion seam and dispatches each schema through the ordered
 * `schemaRules` table from `emit/parseSchema.ts`. Every converter is a standalone function that
 * recurses through the `parse` function passed to it, so this file only wires state to them.
 *
 * @internal
 */
export function createSchemaParser(ctx: OasParserContext) {
  const { document, refs, renames } = ctx
  const options: ast.ParserOptions = { ...DEFAULT_PARSER_OPTIONS, ...ctx.options }

  /**
   * Converts an OAS `SchemaObject` into a `SchemaNode`: the first matching rule in
   * {@link schemaRules} wins, otherwise the configured `emptySchemaType` applies.
   */
  function parseSchema({ schema, name }: { schema: SchemaObject; name?: string | null }): ast.SchemaNode {
    const flattenedSchema = flattenSchema(schema)
    if (flattenedSchema !== schema) {
      return parseSchema({ schema: flattenedSchema, name })
    }

    const nullable = isNullable(schema) || undefined
    const defaultValue = schema.default === null && nullable ? undefined : schema.default
    const type = Array.isArray(schema.type) ? (schema.type.find((t) => t !== 'null') ?? schema.type[0]) : schema.type

    const context: ConvertContext = {
      schema,
      name,
      nullable,
      defaultValue,
      type,
      options,
      parse: parseSchema,
      document,
      refs,
      renames,
    }

    for (const rule of schemaRules) {
      if (rule.match(context)) return rule.convert(context)
    }

    return createNode(context, { type: options.emptySchemaType as ast.ScalarSchemaType })
  }

  return { parseSchema }
}
