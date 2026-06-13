/**
 * The spec-specific questions a schema parser answers while turning a source document into Kubb
 * AST nodes. The rest of the pipeline is generic JSON Schema, so this is the one seam where
 * OpenAPI, AsyncAPI, and plain JSON Schema differ.
 */
export type SchemaDialect<TSchema = unknown, TRef = TSchema, TDiscriminated = TSchema, TDocument = unknown> = {
  /**
   * Identifies the dialect in logs and diagnostics.
   */
  name: string
  /**
   * Whether the schema is nullable.
   */
  isNullable: (schema?: TSchema) => boolean
  /**
   * Whether the value is a `$ref` pointer.
   */
  isReference: (value?: unknown) => value is TRef
  /**
   * Whether the schema carries a discriminator for polymorphism.
   */
  isDiscriminator: (value?: unknown) => value is TDiscriminated
  /**
   * Whether the schema is binary data, converted to a `blob` node.
   */
  isBinary: (schema: TSchema) => boolean
  /**
   * Resolves a local `$ref` against the document, or nullish when it cannot.
   */
  resolveRef: <TResolved>(document: TDocument, ref: string) => TResolved | null | undefined
}

/**
 * Types a {@link SchemaDialect} for an adapter. Adds no runtime behavior and only pins the
 * dialect's type for inference.
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
