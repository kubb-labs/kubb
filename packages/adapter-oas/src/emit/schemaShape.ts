import type { ast } from '@kubb/ast'
import { formatMap, specialCasedFormats, structuralKeys } from '../constants.ts'
import { isReference } from '../oas.ts'
import type { SchemaObject } from '../types.ts'

/**
 * Returns the Kubb `SchemaType` for a given OAS `format` string, or `null` if not found.
 * Formats not in `formatMap` (e.g., `int64`, `uint64`, `date-time`) are handled separately by parser options.
 */
export function getSchemaType(format: string): ast.SchemaType | null {
  return formatMap[format as keyof typeof formatMap] ?? null
}

/**
 * Whether the parser maps `format` to a dedicated type. True for any `formatMap` entry, plus the
 * `specialCasedFormats` that `convertFormat` handles directly (int64, uint64, date-time, date, time). False means the format falls back to
 * the base type, which is what `KUBB_UNSUPPORTED_FORMAT` flags. Reading both sources keeps the
 * diagnostic in step with the parser as `formatMap` grows.
 */
export function isHandledFormat(format: string): boolean {
  return getSchemaType(format) !== null || specialCasedFormats.has(format)
}

/**
 * Converts an OAS primitive type string to its `PrimitiveSchemaType` equivalent.
 * Numeric types (`number`, `integer`, `bigint`) pass through unchanged. `boolean` maps to `'boolean'`. Everything else becomes `'string'`.
 */
export function getPrimitiveType(type: string | undefined): ast.PrimitiveSchemaType {
  if (type === 'number' || type === 'integer' || type === 'bigint') return type
  if (type === 'boolean') return 'boolean'

  return 'string'
}

/**
 * Resolves the AST type descriptor for a date/time format, honoring the `dateType` option.
 * Returns `null` when `dateType: false`, so the format falls through to `string`.
 */
export function getDateType(
  options: ast.ParserOptions,
  format: 'date-time' | 'date' | 'time',
): { type: 'datetime'; offset?: boolean; local?: boolean } | { type: 'date' | 'time'; representation: 'date' | 'string' } | null {
  if (!options.dateType) {
    return null
  }

  if (format === 'date-time') {
    if (options.dateType === 'date') {
      return { type: 'date', representation: 'date' }
    }
    if (options.dateType === 'stringOffset') {
      return { type: 'datetime', offset: true }
    }
    if (options.dateType === 'stringLocal') {
      return { type: 'datetime', local: true }
    }
    return { type: 'datetime', offset: false }
  }

  if (format === 'date') {
    return {
      type: 'date',
      representation: options.dateType === 'date' ? 'date' : 'string',
    }
  }

  // time
  return {
    type: 'time',
    representation: options.dateType === 'date' ? 'date' : 'string',
  }
}

/**
 * Reads a schema's numeric `exclusiveMinimum`/`exclusiveMaximum` bounds (the OAS 3.1 numeric
 * form). Either key is `undefined` when absent or, for the legacy OAS 3.0 boolean form, not a
 * number.
 */
export function getExclusiveBounds(schema: SchemaObject): { exclusiveMinimum: number | undefined; exclusiveMaximum: number | undefined } {
  return {
    exclusiveMinimum: typeof schema.exclusiveMinimum === 'number' ? schema.exclusiveMinimum : undefined,
    exclusiveMaximum: typeof schema.exclusiveMaximum === 'number' ? schema.exclusiveMaximum : undefined,
  }
}

/**
 * Reads schema examples as an array. OAS 3.1 uses an `examples` array, but specs (including ones
 * labeled 3.1) still use the singular OAS 3.0 `example`, which the upgrader only converts on the
 * 3.0 -> 3.1 hop. Normalize both into one array so the AST node exposes only `examples`.
 */
export function extractExamples(schema: SchemaObject): Array<unknown> | undefined {
  if (Array.isArray(schema.examples)) return schema.examples
  return schema.example !== undefined ? [schema.example] : undefined
}

/**
 * Returns `true` when `fragment` carries any JSON Schema keyword that makes it
 * structurally significant on its own (see `structuralKeys`).
 *
 * A fragment with a structural keyword can't be safely merged into a parent schema.
 */
function hasStructuralKeywords(fragment: SchemaObject): boolean {
  return Object.keys(fragment).some((key) => structuralKeys.has(key as 'properties'))
}

/**
 * Flattens a keyword-only `allOf` into its parent schema.
 *
 * Only flattens when every member is a plain fragment, with no `$ref` and no structural keywords
 * (see `structuralKeys`). Outer schema values take precedence over fragment values.
 * Returns `null` for a `null` input, and the original schema unchanged when flattening is unsafe.
 *
 * @example
 * ```ts
 * flattenSchema({ allOf: [{ description: 'A pet' }], type: 'object', properties: {} })
 * // { type: 'object', properties: {}, description: 'A pet' }
 * ```
 *
 * @example
 * ```ts
 * flattenSchema({ allOf: [{ $ref: '#/components/schemas/Pet' }] })
 * // returned unchanged, contains a $ref
 * ```
 */
export function flattenSchema(schema: SchemaObject | null): SchemaObject | null {
  if (!schema?.allOf || schema.allOf.length === 0) return schema ?? null

  const allOfFragments = schema.allOf as Array<SchemaObject>
  if (allOfFragments.some((item) => isReference(item))) return schema
  if (allOfFragments.some(hasStructuralKeywords)) return schema

  // Destructure `allOf` out instead of `delete merged.allOf`: a `delete` transitions the freshly
  // spread object into V8 dictionary (slow) mode, and this runs per `allOf` schema during parsing.
  const { allOf: _allOf, ...rest } = schema
  const merged = rest as SchemaObject

  for (const fragment of allOfFragments) {
    for (const [key, value] of Object.entries(fragment)) {
      merged[key as keyof SchemaObject] ??= value as SchemaObject[keyof SchemaObject]
    }
  }

  return merged
}
