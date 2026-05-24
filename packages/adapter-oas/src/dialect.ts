import { ast } from '@kubb/core'
import { isDiscriminator, isNullable, isReference } from './guards.ts'
import { resolveRef } from './refs.ts'
import type { SchemaObject } from './types.ts'

/**
 * The OpenAPI / Swagger dialect — the default used by `@kubb/adapter-oas`.
 *
 * Implements the spec-agnostic {@link ast.SchemaDialect} contract: it isolates the
 * decisions that differ between specs (nullability, `$ref`, discriminator, binary,
 * ref resolution) so the converter pipeline and dispatch rules stay shared. A
 * future adapter (e.g. AsyncAPI) ships its own dialect — `type: ['null', …]`
 * nullability, no discriminator object, binary via `contentEncoding` — and reuses
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
export const oasDialect = ast.defineSchemaDialect({
  name: 'oas',
  isNullable,
  isReference,
  isDiscriminator,
  isBinary: (schema: SchemaObject) => schema.type === 'string' && schema.contentMediaType === 'application/octet-stream',
  resolveRef,
})

/**
 * The concrete dialect type for `@kubb/adapter-oas`. Keeps the OAS guard predicates
 * (`isReference`, `isDiscriminator`) intact so converters narrow schemas after a check.
 */
export type OasDialect = typeof oasDialect
