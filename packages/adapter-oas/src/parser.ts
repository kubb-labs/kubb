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
   * Renames from `getSchemas`, keyed by the collision-renamed component or nested `$defs` pointer.
   * `convertRef` stamps `targetName` from it at ref creation, so refs to renamed schemas resolve
   * to the emitted name without a post-parse pass.
   */
  renames?: ReadonlyMap<string, string>
  options?: Partial<ast.ParserOptions>
}

/**
 * Creates the schema converter bound to one OpenAPI document: `parseSchema` dispatches each
 * schema through the ordered `schemaRules` table, with the parser options merged once.
 *
 * @internal
 */
export function createSchemaParser(ctx: OasParserContext) {
  const { document, refs, renames } = ctx
  const options: ast.ParserOptions = { ...DEFAULT_PARSER_OPTIONS, ...ctx.options }

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

    const rule = schemaRules.find((entry) => entry.match(context))
    const node = rule ? rule.convert(context) : createNode(context, { type: options.emptySchemaType as ast.ScalarSchemaType })

    return withConditional(node, schema)
  }

  /** Adds JSON Schema `if`/`then`/`else` to the converted node, whatever its type. */
  function withConditional(node: ast.SchemaNode, schema: SchemaObject): ast.SchemaNode {
    const { if: condition, then, else: otherwise } = schema as { if?: unknown; then?: unknown; else?: unknown }
    if (!condition || typeof condition !== 'object') return node
    const branch = (value: unknown) => (value && typeof value === 'object' ? parseSchema({ schema: value as SchemaObject }) : undefined)
    const thenNode = branch(then)
    const elseNode = branch(otherwise)

    return { ...node, conditional: { if: branch(condition)!, ...(thenNode && { then: thenNode }), ...(elseNode && { else: elseNode }) } }
  }

  return parseSchema
}
