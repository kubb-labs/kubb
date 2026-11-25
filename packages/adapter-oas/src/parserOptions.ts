/**
 * How `format: 'date-time'` schemas are represented downstream.
 * - `false` falls through to a plain `string` (no validation).
 * - `'string'` emits a datetime string node.
 * - `'stringOffset'` emits a datetime node with timezone offset.
 * - `'stringLocal'` emits a local datetime node.
 * - `'date'` emits a `date` node (JavaScript `Date` object).
 */
export type DateTimeTypeValue = false | 'string' | 'stringOffset' | 'stringLocal' | 'date'

/**
 * How `format: 'date'` or `format: 'time'` schemas are represented downstream.
 * - `false` falls through to a plain `string` (no validation).
 * - `'string'` (default) emits a date or time string node.
 * - `'date'` emits a `date`/`time` node (JavaScript `Date` object).
 */
export type DateOnlyTypeValue = false | 'string' | 'date'

/**
 * Per-format override of `dateType`, so `date-time`, `date`, and `time` schemas can each
 * resolve to a different representation. A key left out defaults to `'string'`, the same
 * default as the scalar form of `dateType`.
 */
export type DateTypeOptions = {
  dateTime?: DateTimeTypeValue
  date?: DateOnlyTypeValue
  time?: DateOnlyTypeValue
}

/**
 * Options that control how the adapter parser maps source schemas to AST nodes.
 */
export type ParserOptions = {
  /**
   * How `date-time`, `date`, and `time` formatted schemas are represented downstream.
   * A scalar value ({@link DateTimeTypeValue}) applies to all three formats, matching
   * the pre-5.1 behavior. Pass a {@link DateTypeOptions} object to set `dateTime`,
   * `date`, and `time` independently.
   *
   * @example Represent `date-time` as a JS `Date`, keep `date` and `time` as strings
   * ```ts
   * dateType: { dateTime: 'date' }
   * ```
   */
  dateType: DateTimeTypeValue | DateTypeOptions
  /**
   * How a schema with `format: 'int64'` or `format: 'uint64'` maps to TypeScript. Other
   * integers always map to `number`.
   * - `'bigint'` is exact for 64-bit IDs, but does not round-trip through JSON.
   * - `'number'` fits most JSON APIs. Loses precision above `Number.MAX_SAFE_INTEGER`.
   *
   * @default 'bigint'
   */
  integerType?: 'number' | 'bigint'
  /**
   * AST type used when a schema's type cannot be inferred from the spec
   * (`additionalProperties: true`, missing `type`, ...).
   */
  unknownType: 'any' | 'unknown' | 'void'
  /**
   * AST type used for completely empty schemas (`{}`).
   */
  emptySchemaType: 'any' | 'unknown' | 'void'
  /**
   * Suffix appended to derived enum names when Kubb has to invent one
   * (typically for inline enums on object properties).
   */
  enumSuffix: 'enum' | (string & {})
}
