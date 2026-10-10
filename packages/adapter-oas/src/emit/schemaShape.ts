import type { ast } from '@kubb/kit'
import { formatMap, specialCasedFormats, structuralKeys } from '../constants.ts'
import { isReference } from '../oas.ts'
import type { SchemaObject } from '../types.ts'

/**
 * Whether the parser maps `format` to a dedicated type: any `formatMap` entry, plus the
 * `specialCasedFormats` that `convertFormat` handles directly. False means the format falls back
 * to the base type, which is what `KUBB_UNSUPPORTED_FORMAT` flags.
 */
export function isHandledFormat(format: string): boolean {
  return formatMap[format as keyof typeof formatMap] !== undefined || specialCasedFormats.has(format)
}

/**
 * Resolves the `dateType` option down to the value for one format. The scalar form of
 * `dateType` applies to every format; the object form picks `dateTime`/`date`/`time`
 * individually and defaults an omitted key to `'string'`.
 */
export function resolveDateTypeValue(
  dateType: ast.ParserOptions['dateType'],
  format: 'date-time' | 'date' | 'time',
): ast.DateTimeTypeValue | ast.DateOnlyTypeValue {
  if (typeof dateType !== 'object' || dateType === null) {
    return dateType
  }

  const key = format === 'date-time' ? 'dateTime' : format
  return dateType[key] ?? 'string'
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

// A fragment carrying a structural keyword (see `structuralKeys`) can't be merged into its parent.
function hasStructuralKeywords(fragment: SchemaObject): boolean {
  return Object.keys(fragment).some((key) => structuralKeys.has(key as 'properties'))
}

/**
 * Flattens a keyword-only `allOf` into its parent schema.
 *
 * Only flattens when every member is a plain fragment, with no `$ref` and no structural keywords
 * (see `structuralKeys`). Outer schema values take precedence over fragment values. Returns the
 * original schema unchanged when flattening is unsafe.
 *
 * @example
 * ```ts
 * flattenSchema({ allOf: [{ description: 'A pet' }], type: 'object', properties: {} })
 * // { type: 'object', properties: {}, description: 'A pet' }
 * flattenSchema({ allOf: [{ $ref: '#/components/schemas/Pet' }] })
 * // returned unchanged, contains a $ref
 * ```
 */
export function flattenSchema(schema: SchemaObject): SchemaObject {
  if (!schema.allOf?.length) return schema

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
