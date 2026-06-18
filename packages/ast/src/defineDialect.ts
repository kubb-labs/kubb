import type { Node } from './nodes/index.ts'

/**
 * The spec-specific questions a schema parser answers while turning a source document into Kubb
 * AST nodes. The rest of the pipeline is generic JSON Schema, so this is the one seam where
 * OpenAPI, AsyncAPI, and plain JSON Schema differ.
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
 * How a dialect collapses structurally identical schemas into shared definitions. The contract is
 * generic over the plan and context types, which the adapter supplies. The mechanics live in the
 * adapter, not here, so `@kubb/ast` carries no dedupe logic. The returned plan owns the rewriting
 * behavior, so callers interact with one object.
 */
export type Dedupe<TPlan = unknown, TContext = unknown> = {
  /**
   * Scans a forest of nodes and produces a plan describing which shapes to share.
   */
  plan(roots: ReadonlyArray<Node>, context: TContext): TPlan
}

/**
 * A spec adapter's dialect. `name` identifies it in logs and diagnostics, `schema` holds the
 * spec-specific schema questions the parser answers, and the optional `dedupe` is the
 * schema-sharing seam an adapter can supply to collapse repeated shapes.
 */
export type Dialect<TSchema = unknown, TRef = TSchema, TDiscriminated = TSchema, TDocument = unknown, TDedupe extends Dedupe = Dedupe> = {
  /**
   * Identifies the dialect in logs and diagnostics.
   */
  name: string
  /**
   * The spec-specific schema behavior. See {@link SchemaDialect}.
   */
  schema: SchemaDialect<TSchema, TRef, TDiscriminated, TDocument>
  /**
   * The schema-sharing behavior. See {@link Dedupe}. Omit it to emit every named schema as its
   * own type.
   */
  dedupe?: TDedupe
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
export function defineDialect<TSchema, TRef, TDiscriminated, TDocument, TDedupe extends Dedupe>(
  dialect: Dialect<TSchema, TRef, TDiscriminated, TDocument, TDedupe>,
): Dialect<TSchema, TRef, TDiscriminated, TDocument, TDedupe> {
  return dialect
}
