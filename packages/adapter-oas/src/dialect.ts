import { isDiscriminator, isNullable, isReference } from './guards.ts'
import { resolveRef } from './refs.ts'
import type { SchemaObject } from './types.ts'

/**
 * The spec-specific decisions a schema parser makes while converting a source
 * document's schemas into Kubb AST nodes.
 *
 * Everything else in `createSchemaParser` is generic JSON Schema shared across
 * adapters; this object is the one seam where a spec differs. A future adapter
 * (e.g. AsyncAPI) supplies its own dialect — nullability via `type: ['null', …]`
 * only, no discriminator object, binary via `contentEncoding` — and reuses the
 * converter pipeline and dispatch rules unchanged.
 *
 * Formats (`uuid`, `email`, dates, …) are intentionally NOT here: they are shared
 * JSON Schema vocabulary, so keeping them in the converters avoids duplicating
 * the common case across adapters.
 */
export type SchemaDialect = {
  /** Identifies the dialect in logs and while debugging dispatch. */
  name: string
  /** Whether a schema should be treated as nullable. */
  isNullable: typeof isNullable
  /** Whether a value is a `$ref` pointer object. */
  isReference: typeof isReference
  /** Whether a schema carries a structured discriminator (polymorphism). */
  isDiscriminator: typeof isDiscriminator
  /** Whether a schema represents binary data (converted to a `blob` node). */
  isBinary: (schema: SchemaObject) => boolean
  /** Resolves a local `$ref` pointer against the document. */
  resolveRef: typeof resolveRef
}

/**
 * The OpenAPI / Swagger dialect — the default used by `@kubb/adapter-oas`.
 *
 * @example
 * ```ts
 * const parser = createSchemaParser(context)            // uses oasDialect
 * const parser = createSchemaParser(context, oasDialect) // explicit
 * ```
 */
export const oasDialect: SchemaDialect = {
  name: 'oas',
  isNullable,
  isReference,
  isDiscriminator,
  isBinary: (schema) => schema.type === 'string' && schema.contentMediaType === 'application/octet-stream',
  resolveRef,
}
