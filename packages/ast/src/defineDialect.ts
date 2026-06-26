/**
 * The spec-specific questions a schema parser answers while turning a source document into Kubb
 * AST nodes. The rest of the pipeline is generic, so this is the one seam where source formats
 * differ.
 */
export type SchemaDialect<TSchema = unknown, TRef = TSchema, TDiscriminated = TSchema, TDocument = unknown> = {
  /**
   * Whether the schema is nullable.
   */
  isNullable(schema?: TSchema): boolean
  /**
   * Whether the value is a `$ref` pointer.
   */
  isReference(value?: unknown): value is TRef
  /**
   * Whether the schema carries a discriminator for polymorphism.
   */
  isDiscriminator(value?: unknown): value is TDiscriminated
  /**
   * Whether the schema is binary data, converted to a `blob` node.
   */
  isBinary(schema: TSchema): boolean
  /**
   * Resolves a local `$ref` against the document, or nullish when it cannot.
   */
  resolveRef<TResolved>(document: TDocument, ref: string): TResolved | null | undefined
}

/**
 * A spec adapter's dialect. `name` identifies it in logs and diagnostics, and `schema` holds the
 * spec-specific schema questions the parser answers.
 */
export type Dialect<TSchema = unknown, TRef = TSchema, TDiscriminated = TSchema, TDocument = unknown> = {
  /**
   * Identifies the dialect in logs and diagnostics.
   */
  name: string
  /**
   * The spec-specific schema behavior. See {@link SchemaDialect}.
   */
  schema: SchemaDialect<TSchema, TRef, TDiscriminated, TDocument>
}

/**
 * Types a {@link Dialect} for an adapter. Adds no runtime behavior and only pins the
 * dialect's type for inference.
 *
 * @example
 * ```ts
 * export const oasDialect = defineDialect({
 *   name: 'oas',
 *   schema: {
 *     isNullable,
 *     isReference,
 *     isDiscriminator,
 *     isBinary: (schema) => schema.type === 'string' && schema.contentMediaType === 'application/octet-stream',
 *     resolveRef,
 *   },
 * })
 * ```
 */
export function defineDialect<TSchema, TRef, TDiscriminated, TDocument>(
  dialect: Dialect<TSchema, TRef, TDiscriminated, TDocument>,
): Dialect<TSchema, TRef, TDiscriminated, TDocument> {
  return dialect
}
