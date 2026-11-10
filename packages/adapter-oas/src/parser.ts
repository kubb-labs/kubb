import { ast } from '@kubb/kit'
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

    return withConditionals(node, schema)
  }

  /** An object that requires `keys` to be present, whatever their values. */
  function requireKeys(keys: Array<string>): ast.SchemaNode {
    const unknown = ast.factory.createSchema({ type: ast.schemaTypes.unknown })
    return ast.factory.createSchema({
      type: ast.schemaTypes.object,
      primitive: 'object',
      properties: keys.map((name) => ast.factory.createProperty({ name, required: true, schema: unknown })),
    })
  }

  /**
   * Adds JSON Schema `if`/`then`/`else`, `dependentRequired` and `dependentSchemas` to the converted node as
   * `conditionals`, whatever its type. A dependency is `if` the trigger key is present `then` the rest.
   */
  function withConditionals(node: ast.SchemaNode, schema: SchemaObject): ast.SchemaNode {
    const keywords = schema as { if?: unknown; then?: unknown; else?: unknown; dependentRequired?: unknown; dependentSchemas?: unknown }
    const branch = (value: unknown) => {
      if (!value || typeof value !== 'object') return undefined
      const { required, type, ...rest } = value as SchemaObject
      // A subschema with only `required`, such as `{ required: ['postalCode'] }`, would otherwise parse as `unknown`.
      if (Array.isArray(required) && required.length && (type === undefined || type === 'object') && !Object.keys(rest).length) return requireKeys(required)
      return parseSchema({ schema: value as SchemaObject })
    }
    const entries = (value: unknown) => (value && typeof value === 'object' ? Object.entries(value) : [])
    const conditionals: NonNullable<ast.SchemaNode['conditionals']> = []

    const condition = branch(keywords.if)
    if (condition) {
      const thenNode = branch(keywords.then)
      const elseNode = branch(keywords.else)
      conditionals.push({ if: condition, ...(thenNode && { then: thenNode }), ...(elseNode && { else: elseNode }) })
    }
    for (const [key, required] of entries(keywords.dependentRequired)) {
      if (Array.isArray(required) && required.every((name) => typeof name === 'string'))
        conditionals.push({ if: requireKeys([key]), then: requireKeys(required) })
    }
    for (const [key, dependent] of entries(keywords.dependentSchemas)) {
      const thenNode = branch(dependent)
      if (thenNode) conditionals.push({ if: requireKeys([key]), then: thenNode })
    }

    return conditionals.length ? { ...node, conditionals } : node
  }

  return parseSchema
}
