import { ast } from '@kubb/kit'
import { DEFAULT_PARSER_OPTIONS } from './constants.ts'
import { isAnnotationMember } from './emit/converters/composition.ts'
import { createNode } from './emit/createNode.ts'
import { type ConvertContext, type ParseFn, schemaRules } from './emit/parseSchema.ts'
import { flattenSchema } from './emit/schemaShape.ts'
import { isNullable } from './oas.ts'
import type { Refs } from './refs.ts'
import type { Document, SchemaObject } from './types.ts'
import type { ParserOptions } from './parserOptions.ts'

/**
 * Parser context holding the raw OpenAPI document and its `$ref` service.
 */
export type SchemaParserOptions = {
  document: Document
  refs: Refs
  /**
   * Renames from `getSchemas`, keyed by the collision-renamed component or nested `$defs` pointer.
   * `convertRef` stamps `targetName` from it at ref creation, so refs to renamed schemas resolve
   * to the emitted name without a post-parse pass.
   */
  renames?: ReadonlyMap<string, string>
  options?: Partial<ParserOptions>
}

/**
 * `unevaluated*` also sees what composition siblings evaluate, so with such a sibling it is dropped to keep the schema open.
 */
function hasUnevaluatedSiblings(schema: SchemaObject): boolean {
  if (schema.unevaluatedProperties === undefined && schema.unevaluatedItems === undefined) return false
  return [schema.allOf, schema.anyOf, schema.oneOf, schema.if, schema.dependentSchemas, schema.$ref].some((value) => value !== undefined)
}

function isKeyList(value: unknown): value is Array<string> {
  return Array.isArray(value) && value.length > 0 && value.every((name) => typeof name === 'string')
}

/**
 * The schema converter bound to one OpenAPI document: `parse` dispatches each schema through the
 * ordered `schemaRules` table, with the parser options merged once.
 *
 * @internal
 */
export class SchemaParser {
  readonly #document: Document
  readonly #refs: Refs
  readonly #renames: ReadonlyMap<string, string> | undefined
  readonly #options: ParserOptions
  // The key lists of the presence checks `#requireKeys` builds, so two entries that check the same keys compare equal.
  readonly #presenceKeys = new WeakMap<ast.SchemaNode, string>()

  constructor(ctx: SchemaParserOptions) {
    this.#document = ctx.document
    this.#refs = ctx.refs
    this.#renames = ctx.renames
    this.#options = { ...DEFAULT_PARSER_OPTIONS, ...ctx.options }
  }

  /**
   * Converts one OpenAPI schema into a `SchemaNode`, through the first matching rule of `schemaRules`.
   */
  parse: ParseFn = ({ schema, name }) => {
    const options = this.#options
    // A JSON Schema boolean: `true` accepts any value and `false` accepts none.
    if (typeof schema === 'boolean') {
      return ast.factory.createSchema({ type: schema ? (options.emptySchemaType as ast.ScalarSchemaType) : 'never', name: name ?? undefined })
    }

    const flattenedSchema = flattenSchema(schema)
    if (flattenedSchema !== schema) {
      // `flattenSchema` keeps the first value of each keyword, so the conditionals of the schema and of every member are read on their own.
      const { if: _if, then: _then, else: _else, dependentRequired: _required, dependentSchemas: _schemas, ...shape } = flattenedSchema
      return this.#withConditionals(this.parse({ schema: shape, name }), [schema, ...(schema.allOf as Array<SchemaObject>)])
    }
    if (hasUnevaluatedSiblings(schema)) {
      const { unevaluatedProperties: _properties, unevaluatedItems: _items, ...open } = schema
      return this.parse({ schema: open, name })
    }

    return this.#convert({ schema, name })
  }

  #convert({ schema, name }: { schema: SchemaObject; name?: string | null }): ast.SchemaNode {
    const options = this.#options
    const nullable = isNullable(schema, this.#document) || undefined
    const defaultValue = schema.default === null && nullable ? undefined : schema.default
    const type = Array.isArray(schema.type) ? (schema.type.find((t) => t !== 'null') ?? schema.type[0]) : schema.type

    const context: ConvertContext = {
      schema,
      name,
      nullable,
      defaultValue,
      type,
      options,
      parse: this.parse,
      document: this.#document,
      refs: this.#refs,
      renames: this.#renames,
    }

    const rule = schemaRules.find((entry) => entry.match(context))
    const node = rule ? rule.convert(context) : createNode(context, { type: options.emptySchemaType as ast.ScalarSchemaType })

    // `allOf` members that hold only annotations and `if`/`then`/`else` are not parsed as members, so read their conditionals here.
    const annotationMembers = Array.isArray(schema.allOf) ? (schema.allOf as Array<SchemaObject>).filter(isAnnotationMember) : []
    return this.#withConditionals(node, [schema, ...annotationMembers])
  }

  #requireKeys(keys: Array<string>): ast.SchemaNode {
    const unknown = ast.factory.createSchema({ type: ast.schema.types.unknown })
    const node = ast.factory.createSchema({
      type: ast.schema.types.object,
      primitive: 'object',
      properties: keys.map((name) => ast.factory.createProperty({ name, required: true, schema: unknown })),
    })
    this.#presenceKeys.set(node, keys.join('\0'))
    return node
  }

  #withConditionals(node: ast.SchemaNode, sources: Array<SchemaObject>): ast.SchemaNode {
    const conditionals = sources.flatMap((source) => this.#toConditionals(source))
    // A collapsed one-member `allOf` already carries the conditionals of its member, so a repeated entry is skipped.
    const existing = new Set((node.conditionals ?? []).map((entry) => this.#presenceKey(entry)))
    const added = conditionals.filter((entry) => {
      const key = this.#presenceKey(entry)
      return key === undefined || !existing.has(key)
    })
    return added.length ? { ...node, conditionals: [...(node.conditionals ?? []), ...added] } : node
  }

  // The keys an entry checks for presence, or `undefined` when a branch checks more than presence and the entry is always kept.
  #presenceKey({ if: condition, then: thenNode, else: elseNode }: NonNullable<ast.SchemaNode['conditionals']>[number]): string | undefined {
    const keys = [condition, thenNode, elseNode].map((branch) => (branch ? this.#presenceKeys.get(branch) : ''))
    return keys.includes(undefined) ? undefined : keys.join('\n')
  }

  #toBranch(value: unknown): ast.SchemaNode | undefined {
    if (!value || typeof value !== 'object') return undefined
    const { required, type, ...rest } = value as SchemaObject
    // A subschema with only `required`, such as `{ required: ['postalCode'] }`, would otherwise parse as `unknown`.
    if (Array.isArray(required) && required.length && (type === undefined || type === 'object') && !Object.keys(rest).length) return this.#requireKeys(required)
    return this.parse({ schema: value as SchemaObject })
  }

  #toConditionals(schema: SchemaObject): NonNullable<ast.SchemaNode['conditionals']> {
    const entries = (value: unknown) => (value && typeof value === 'object' ? Object.entries(value) : [])
    const conditionals: NonNullable<ast.SchemaNode['conditionals']> = []

    const condition = this.#toBranch(schema.if)
    if (condition) {
      const thenNode = this.#toBranch(schema.then)
      const elseNode = this.#toBranch(schema.else)
      conditionals.push({ if: condition, ...(thenNode && { then: thenNode }), ...(elseNode && { else: elseNode }) })
    }
    for (const [key, required] of entries(schema.dependentRequired)) {
      if (isKeyList(required)) conditionals.push({ if: this.#requireKeys([key]), then: this.#requireKeys(required) })
    }
    for (const [key, dependent] of entries(schema.dependentSchemas)) {
      const thenNode = this.#toBranch(dependent)
      if (thenNode) conditionals.push({ if: this.#requireKeys([key]), then: thenNode })
    }

    return conditionals
  }
}

/**
 * Creates the schema converter bound to one OpenAPI document.
 *
 * @internal
 */
export function createSchemaParser(ctx: SchemaParserOptions): SchemaParser {
  return new SchemaParser(ctx)
}
