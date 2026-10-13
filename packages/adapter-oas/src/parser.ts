import type { ast } from '@kubb/kit'
import { DEFAULT_PARSER_OPTIONS } from './constants.ts'
import { createNode } from './emit/createNode.ts'
import { type ConvertContext, schemaRules } from './emit/parseSchema.ts'
import { flattenSchema } from './emit/schemaShape.ts'
import { resolveUnionMembers } from './emit/converters/composition.ts'
import { isNullable, isReference } from './oas.ts'
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
    // Parse `not` once, apart from the rest: converters that re-parse a copy of the schema (the shared
    // properties of a union, the own properties of an `allOf`) would otherwise attach it again.
    if (schema.not && typeof schema.not === 'object') {
      const { not: negated, ...rest } = schema
      const node = parseSchema({ schema: rest as SchemaObject, name })
      // `derefKeepingRef` copies the target's keywords next to a `$ref`, and the target already carries its own `not`.
      if (isReference(schema)) return node

      return { ...node, not: parseSchema({ schema: completeRequiredKeys(negated as SchemaObject) }) }
    }

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

  return parseSchema
}

/**
 * Declares every `required` key that has no property schema as `{}`, on the schema and its `allOf` members.
 * `oneOf`/`anyOf` members already get this from `convertUnion`.
 *
 * A schema inside `not` is negated, so it must not match more than the spec says: a required key that is
 * dropped during conversion would turn `not: { required: [a] }` into "reject everything".
 */
function completeRequiredKeys(schema: SchemaObject): SchemaObject {
  const completed = (resolveUnionMembers([schema], {})[0] as SchemaObject) ?? schema
  if (!Array.isArray(completed.allOf)) return completed

  const next = { ...completed }
  next.allOf = completed.allOf.map((member) => completeRequiredKeys(member as SchemaObject)) as typeof completed.allOf
  return next
}
