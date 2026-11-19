export { applyOptionality } from '../optionality.ts'
export { schemaTypes as types } from '../constants.ts'
export { narrowSchema as narrow } from '../guards.ts'
export { findSchema as find } from '../visitor.ts'
export { getEmbeddedJson } from './embeddedJson.ts'
import type { NumberSchemaNode, SchemaNode } from '../nodes/schema.ts'
import type { PropertyNode } from '../nodes/property.ts'
import { is } from './is.ts'

export { getChecks, getObjectKind } from './checks.ts'
export type { ObjectKind, ObjectKindOptions, SchemaCheck } from './checks.ts'
export { is } from './is.ts'
export type { IsOptions, SchemaFollow, SchemaKind } from './is.ts'
export {
  getSchemaLiteralValues as getLiterals,
  inferDiscriminatorPropertyName as inferDiscriminator,
  resolveSchemaProperties as findProperties,
} from '../utils/schemaProperties.ts'

/**
 * Whether a schema prints as a plain `string`: string-like types, and `date` or `time` with a `'string'` representation.
 * @deprecated Use `ast.schema.is(node, 'string')`. Removed in Kubb v6.
 */
export function isString(node: SchemaNode): boolean {
  return is(node, 'string')
}

// Integer formats whose whole range is a safe integer. The 64-bit ranges are not, so they never become a bound.
const integerFormatRanges: Record<string, [min: number, max: number]> = {
  int8: [-(2 ** 7), 2 ** 7 - 1],
  uint8: [0, 2 ** 8 - 1],
  int16: [-(2 ** 15), 2 ** 15 - 1],
  uint16: [0, 2 ** 16 - 1],
  int32: [-(2 ** 31), 2 ** 31 - 1],
  uint32: [0, 2 ** 32 - 1],
}

/**
 * The tightest inclusive bounds of a number schema. An exclusive bound moves to the next point of `step` (`1` for an
 * integer), an integer bound rounds inward, and an integer bound past `Number.MAX_SAFE_INTEGER` is left out, since it
 * prints as a rounded or invalid literal.
 *
 * Pass the number node itself to apply its type and format as well: an `integer` or `bigint` node rounds as an integer,
 * an integer `format` from `int8` to `uint32` adds its range, and `multipleOf` is kept, for an integer only when it is
 * a safe integer.
 *
 * @example
 * ```ts
 * ast.schema.getNumberBounds({ type: 'integer', format: 'int32', min: 0 }) // { min: 0, max: 2147483647 }
 * ```
 */
export function getNumberBounds({
  min,
  max,
  exclusive,
  type,
  format,
  multipleOf,
  integer = type === 'integer' || type === 'bigint',
  step,
}: Pick<NumberSchemaNode, 'min' | 'max' | 'exclusive'> &
  Partial<Pick<NumberSchemaNode, 'type' | 'format' | 'multipleOf'>> & { integer?: boolean; step?: number }): {
  min?: number
  max?: number
  multipleOf?: number
} {
  const range = integer && format ? integerFormatRanges[format] : undefined
  const grid = step ?? (integer ? 1 : undefined)
  const above = (bound: number) => (grid ? (Math.floor(bound / grid) + 1) * grid : bound)
  const below = (bound: number) => (grid ? (Math.ceil(bound / grid) - 1) * grid : bound)
  const tightest = (pick: (...bounds: Array<number>) => number, bounds: Array<number | undefined>) => {
    const usable = bounds.filter((bound): bound is number => bound !== undefined && (!integer || Number.isSafeInteger(bound)))
    return usable.length ? pick(...usable) : undefined
  }
  const lower = tightest(Math.max, [
    min !== undefined && integer ? Math.ceil(min) : min,
    exclusive?.min === undefined ? undefined : above(exclusive.min),
    range?.[0],
  ])
  const upper = tightest(Math.min, [
    max !== undefined && integer ? Math.floor(max) : max,
    exclusive?.max === undefined ? undefined : below(exclusive.max),
    range?.[1],
  ])
  const keepsStep = multipleOf !== undefined && (!integer || Number.isSafeInteger(multipleOf))
  return {
    ...(lower !== undefined ? { min: lower } : {}),
    ...(upper !== undefined ? { max: upper } : {}),
    ...(keepsStep ? { multipleOf } : {}),
  }
}

/**
 * How a property may be left out or set to `null`, as one answer:
 * - `'optional'` the key may be missing
 * - `'nullable'` the key is present and the value may be `null`
 * - `'nullish'` both
 * - `'required'` neither
 *
 * A property that is not `required`, or whose schema is `optional` or `nullish`, may be missing.
 *
 * @example
 * ```ts
 * ast.schema.getOptionality(property) // 'nullish' for a non-required nullable property
 * ```
 */
export function getOptionality({ required, schema }: Pick<PropertyNode, 'required' | 'schema'>): 'required' | 'optional' | 'nullable' | 'nullish' {
  const optional = !required || Boolean(schema.optional || schema.nullish)
  const nullable = Boolean(schema.nullable || schema.nullish)
  if (optional) return nullable ? 'nullish' : 'optional'
  return nullable ? 'nullable' : 'required'
}
