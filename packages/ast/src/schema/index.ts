import { narrowSchema } from '../guards.ts'
import { isJson } from '../mediaType/index.ts'
import type { NumberSchemaNode, SchemaNode, SchemaType, StringSchemaNode } from '../nodes/schema.ts'

export {
  getSchemaLiteralValues as literalValues,
  inferDiscriminatorPropertyName as discriminatorName,
  resolveSchemaProperties as properties,
} from '../utils/schemaProperties.ts'

const plainStringTypes = new Set<SchemaType>(['string', 'uuid', 'email', 'url', 'datetime'])

/** The schema of the JSON document a string holds (`contentMediaType` with `contentSchema`), else `undefined`. */
export function jsonContent({ content }: Pick<StringSchemaNode, 'content'>): SchemaNode | undefined {
  // shortcut: an encoded document (`contentEncoding`) is not decoded, so only its encoding is checked; decode it once a spec needs both.
  if (!content?.schema || content.encoding || !content.mediaType) return undefined
  return isJson(content.mediaType) ? content.schema : undefined
}

/** Whether a schema prints as a plain `string`: string-like types, and `date` or `time` with a `'string'` representation. */
export function isString(node: SchemaNode): boolean {
  if (plainStringTypes.has(node.type)) return true
  const temporal = narrowSchema(node, 'date') ?? narrowSchema(node, 'time')
  return temporal ? temporal.representation !== 'date' : false
}

/**
 * The tightest inclusive bounds of a number schema. An exclusive bound moves to the next point of `step` (`1` for an
 * integer), an integer bound rounds inward, and an integer bound past `Number.MAX_SAFE_INTEGER` is left out, since it
 * prints as a rounded or invalid literal.
 */
export function numberBounds({
  min,
  max,
  exclusive,
  integer = false,
  step,
}: Pick<NumberSchemaNode, 'min' | 'max' | 'exclusive'> & { integer?: boolean; step?: number }): { min?: number; max?: number } {
  const grid = step ?? (integer ? 1 : undefined)
  const above = (bound: number) => (grid ? (Math.floor(bound / grid) + 1) * grid : bound)
  const below = (bound: number) => (grid ? (Math.ceil(bound / grid) - 1) * grid : bound)
  const tightest = (pick: (...bounds: Array<number>) => number, bounds: Array<number | undefined>) => {
    const usable = bounds.filter((bound): bound is number => bound !== undefined && (!integer || Number.isSafeInteger(bound)))
    return usable.length ? pick(...usable) : undefined
  }
  const lower = tightest(Math.max, [min !== undefined && integer ? Math.ceil(min) : min, exclusive?.min === undefined ? undefined : above(exclusive.min)])
  const upper = tightest(Math.min, [max !== undefined && integer ? Math.floor(max) : max, exclusive?.max === undefined ? undefined : below(exclusive.max)])
  return { ...(lower !== undefined ? { min: lower } : {}), ...(upper !== undefined ? { max: upper } : {}) }
}
