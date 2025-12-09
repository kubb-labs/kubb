import { isKeyword, type Schema, schemaKeywords } from '../SchemaMapper.ts'
import type { MiniModifiers } from './ParserHelpers.ts'

/**
 * Utilities for supporting "mini mode" validation libraries.
 *
 * Mini mode refers to validation libraries that use a functional API style
 * with wrapper functions instead of chainable methods. Examples include:
 * - Zod Mini (a smaller version of Zod)
 * - Potential future Valibot implementations
 *
 * These utilities help separate modifier keywords (like optional, nullable)
 * from base schema keywords, allowing parsers to apply modifiers as wrappers
 * around the base schema.
 *
 * @module miniHelpers
 */

/**
 * Keywords that represent modifiers for mini mode.
 * These are separated from the base schema and wrapped around it.
 * Note: describe is included to filter it out, but won't be wrapped
 * (some mini libraries don't support describe).
 */
export const miniModifierKeywords = [
  schemaKeywords.optional,
  schemaKeywords.nullable,
  schemaKeywords.nullish,
  schemaKeywords.default,
  schemaKeywords.describe,
]

/**
 * Extracts mini mode modifiers from a schemas array.
 * This can be reused by any parser (e.g., Zod, Valibot) that needs
 * to support mini/functional API mode.
 *
 * Note: describe is not included in the returned modifiers as many
 * mini libraries don't support it.
 *
 * @param schemas - Array of schema nodes to extract modifiers from
 * @returns Object containing boolean flags and values for each modifier type
 *
 * @example
 * ```ts
 * const schemas = [
 *   { keyword: 'string' },
 *   { keyword: 'optional' },
 *   { keyword: 'default', args: 'hello' }
 * ]
 * const modifiers = extractMiniModifiers(schemas)
 * // { hasOptional: true, defaultValue: 'hello' }
 * ```
 */
export function extractMiniModifiers(schemas: Schema[]): MiniModifiers {
  const defaultSchema = schemas.find((item) => isKeyword(item, schemaKeywords.default)) as { keyword: string; args: unknown } | undefined

  return {
    hasOptional: schemas.some((item) => isKeyword(item, schemaKeywords.optional)),
    hasNullable: schemas.some((item) => isKeyword(item, schemaKeywords.nullable)),
    hasNullish: schemas.some((item) => isKeyword(item, schemaKeywords.nullish)),
    defaultValue: defaultSchema?.args as string | number | true | object | undefined,
  }
}

/**
 * Filters out modifier keywords from schemas for mini mode base schema parsing.
 * This can be reused by any parser (e.g., Zod, Valibot) that needs to
 * separate base schema from modifiers.
 *
 * @param schemas - Array of schema nodes to filter
 * @returns Filtered array without modifier keywords
 *
 * @example
 * ```ts
 * const schemas = [
 *   { keyword: 'string' },
 *   { keyword: 'optional' },
 *   { keyword: 'nullable' }
 * ]
 * const baseSchemas = filterMiniModifiers(schemas)
 * // [{ keyword: 'string' }]
 * ```
 */
export function filterMiniModifiers(schemas: Schema[]): Schema[] {
  return schemas.filter((item) => !miniModifierKeywords.some((keyword) => isKeyword(item, keyword)))
}
