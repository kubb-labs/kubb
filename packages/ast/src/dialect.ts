/**
 * The spec-specific decisions a schema parser makes when converting a source document's schemas
 * into Kubb AST nodes. Everything else in an adapter's schema pipeline is generic JSON Schema,
 * shared across specs, so the dialect is the one seam where specs differ, like a database driver
 * targeting Postgres vs MySQL. Pair it with {@link dispatch}: the rule table picks which converter
 * runs, the dialect answers the spec-specific questions inside it.
 *
 * The guards (`isReference`, `isDiscriminator`) are type predicates, so converters narrow the
 * schema after a check and the type parameters carry the narrowed types through.
 *
 * This is the seam for the JSON Schema family: OpenAPI, AsyncAPI, and plain JSON Schema share
 * `$ref`, `allOf`/`oneOf`, `enum`, and `format` and differ only in these few decisions. A spec on
 * a different type system (GraphQL, with non-null wrappers and named-type references instead of
 * `$ref`) skips `SchemaDialect` and reuses the universal layer directly: the `Adapter` port, the
 * AST factories, and {@link dispatch} with its own rule table.
 */
export type SchemaDialect<TSchema = unknown, TRef = TSchema, TDiscriminated = TSchema, TDocument = unknown> = {
  /**
   * Identifies the dialect in logs and while debugging dispatch.
   */
  name: string
  /**
   * Whether a schema should be treated as nullable.
   */
  isNullable: (schema?: TSchema) => boolean
  /**
   * Whether a value is a `$ref` pointer object.
   */
  isReference: (value?: unknown) => value is TRef
  /**
   * Whether a schema carries a structured discriminator (polymorphism).
   */
  isDiscriminator: (value?: unknown) => value is TDiscriminated
  /**
   * Whether a schema represents binary data (converted to a `blob` node).
   */
  isBinary: (schema: TSchema) => boolean
  /**
   * Resolves a local `$ref` pointer against the document, or nullish when it cannot.
   */
  resolveRef: <TResolved>(document: TDocument, ref: string) => TResolved | null | undefined
}

/**
 * Identity helper that types a {@link SchemaDialect} for an adapter. Like
 * `defineParser`, it adds no runtime behavior, it pins the dialect's type for
 * inference and gives adapter authors a discoverable anchor.
 *
 * @example
 * ```ts
 * export const oasDialect = defineSchemaDialect({
 *   name: 'oas',
 *   isNullable,
 *   isReference,
 *   isDiscriminator,
 *   isBinary: (schema) => schema.type === 'string' && schema.contentMediaType === 'application/octet-stream',
 *   resolveRef,
 * })
 * ```
 */
export function defineSchemaDialect<TSchema, TRef, TDiscriminated, TDocument>(
  dialect: SchemaDialect<TSchema, TRef, TDiscriminated, TDocument>,
): SchemaDialect<TSchema, TRef, TDiscriminated, TDocument> {
  return dialect
}
