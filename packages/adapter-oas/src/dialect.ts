import { ast } from '@kubb/core'
import { plan } from './dedupe.ts'
import { isDiscriminator, isNullable, isReference } from './guards.ts'
import { resolveRef } from './refs.ts'
import type { SchemaObject } from './types.ts'

/**
 * Derives a schema's `optional`/`nullish` flags from a parent's `required` value and the
 * schema's own `nullable`. How "required" and "nullable" combine is OpenAPI-specific, so it
 * lives in the dialect.
 *
 * - Non-required + non-nullable → `optional: true`.
 * - Non-required + nullable → `nullish: true`.
 * - Required → both flags cleared.
 */
function optionality(schema: ast.SchemaNode, required: boolean): ast.SchemaNode {
  const nullable = schema.nullable ?? false

  return {
    ...schema,
    optional: !required && !nullable ? true : undefined,
    nullish: !required && nullable ? true : undefined,
  }
}

/**
 * The OpenAPI / Swagger dialect, the default used by `@kubb/adapter-oas`.
 *
 * Implements the spec-agnostic {@link ast.SchemaDialect} contract: it isolates the
 * decisions that differ between specs (nullability, `$ref`, discriminator, binary,
 * ref resolution) so the converter pipeline and dispatch rules stay shared. A
 * future adapter (e.g. AsyncAPI) ships its own dialect, `type: ['null', …]`
 * nullability, no discriminator object, binary via `contentEncoding` and reuses
 * the rest unchanged.
 *
 * Formats (`uuid`, `email`, dates, …) are intentionally NOT here: they are shared
 * JSON Schema vocabulary, so the converters keep that common case.
 *
 * @example
 * ```ts
 * const parser = createSchemaParser(context)             // uses oasDialect
 * const parser = createSchemaParser(context, oasDialect) // explicit
 * ```
 */
export const oasDialect = ast.defineDialect({
  name: 'oas',
  schema: {
    isNullable,
    isReference,
    isDiscriminator,
    isBinary: (schema: SchemaObject) => schema.type === 'string' && schema.contentMediaType === 'application/octet-stream',
    resolveRef,
    optionality,
  },
  dedupe: { plan },
})

/**
 * The concrete dialect type for `@kubb/adapter-oas`. Keeps the OAS guard predicates
 * (`isReference`, `isDiscriminator`) intact so converters narrow schemas after a check.
 */
export type OasDialect = typeof oasDialect
