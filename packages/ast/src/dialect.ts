/**
 * The spec-specific decisions a schema parser makes while converting a source
 * document's schemas into Kubb AST nodes.
 *
 * Everything else in an adapter's schema pipeline is generic JSON Schema shared
 * across specs; the dialect is the one seam where a spec differs — the
 * "dialect layer" analogue of a database driver targeting Postgres vs MySQL.
 * Pair it with {@link dispatch}: the rule table decides *which* converter runs,
 * the dialect answers the spec-specific questions inside them.
 *
 * The guard methods (`isReference`, `isDiscriminator`) are type predicates so
 * converters narrow the schema after a check; the type parameters carry those
 * narrowed types through.
 *
 * @typeParam TSchema - The adapter's schema object type (e.g. an OpenAPI `SchemaObject`).
 * @typeParam TRef - The narrowed `$ref` pointer type `isReference` proves.
 * @typeParam TDiscriminated - The narrowed discriminated-schema type `isDiscriminator` proves.
 * @typeParam TDocument - The source document `resolveRef` resolves against.
 */
export type SchemaDialect<TSchema = unknown, TRef = TSchema, TDiscriminated = TSchema, TDocument = unknown> = {
  /** Identifies the dialect in logs and while debugging dispatch. */
  name: string
  /** Whether a schema should be treated as nullable. */
  isNullable: (schema?: TSchema) => boolean
  /** Whether a value is a `$ref` pointer object. */
  isReference: (value?: unknown) => value is TRef
  /** Whether a schema carries a structured discriminator (polymorphism). */
  isDiscriminator: (value?: unknown) => value is TDiscriminated
  /** Whether a schema represents binary data (converted to a `blob` node). */
  isBinary: (schema: TSchema) => boolean
  /** Resolves a local `$ref` pointer against the document, or nullish when it cannot. */
  resolveRef: <TResolved>(document: TDocument, ref: string) => TResolved | null | undefined
}

/**
 * Identity helper that types a {@link SchemaDialect} for an adapter. Like
 * `defineParser`, it adds no runtime behavior — it pins the dialect's type for
 * inference and gives adapter authors a discoverable anchor.
 *
 * @example
 * ```ts
 * export const oasDialect = defineDialect<OasDialect>({
 *   name: 'oas',
 *   isNullable,
 *   isReference,
 *   isDiscriminator,
 *   isBinary: (schema) => schema.type === 'string' && schema.contentMediaType === 'application/octet-stream',
 *   resolveRef,
 * })
 * ```
 */
export function defineDialect<TSchema, TRef, TDiscriminated, TDocument>(
  dialect: SchemaDialect<TSchema, TRef, TDiscriminated, TDocument>,
): SchemaDialect<TSchema, TRef, TDiscriminated, TDocument> {
  return dialect
}
