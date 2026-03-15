import type { AdapterFactoryOptions } from '@kubb/core'
import type { contentType, Oas as OasClass } from '@kubb/oas'

type Options = {
  /**
   * Validate the OpenAPI spec before parsing.
   * @default true
   */
  validate?: boolean
  /**
   * Override the `Oas` class (e.g. for custom subclass behavior).
   */
  oasClass?: typeof OasClass
  /**
   * Restrict which content-type is used when extracting request/response schemas.
   * By default, the first valid JSON media type is used.
   */
  contentType?: contentType
  /**
   * How the discriminator field should be interpreted.
   * - `'strict'`  — uses `oneOf` schemas as defined.
   * - `'inherit'` — replaces `oneOf` with the schema from `discriminator.mapping`.
   * @default 'strict'
   */
  discriminator?: 'strict' | 'inherit'
  /**
   * Automatically resolve name collisions across schema components.
   * @default false
   */
  collisionDetection?: boolean
  /**
   * How `format: 'date-time'` schemas are represented in the AST.
   * - `'string'` maps to a `datetime` string node.
   * - `'date'` maps to a JavaScript `Date` node.
   * - `false` falls through to a plain `string` node.
   * @default 'string'
   */
  dateType?: false | 'string' | 'stringOffset' | 'stringLocal' | 'date'
  /**
   * Whether `type: 'integer'` / `format: 'int64'` produces `number` or `bigint` nodes.
   * @default 'number'
   */
  integerType?: 'number' | 'bigint'
  /**
   * AST type used when no schema type can be inferred.
   * @default 'any'
   */
  unknownType?: 'any' | 'unknown' | 'void'
  /**
   * AST type used for completely empty schemas (`{}`).
   * @default `unknownType`
   */
  emptySchemaType?: 'any' | 'unknown' | 'void'
}

export type ResolvedOptions = {
  validate: boolean
  oasClass: Options['oasClass']
  contentType: Options['contentType']
  discriminator: NonNullable<Options['discriminator']>
  collisionDetection: boolean
  dateType: NonNullable<Options['dateType']>
  integerType: NonNullable<Options['integerType']>
  unknownType: NonNullable<Options['unknownType']>
  emptySchemaType: NonNullable<Options['emptySchemaType']>
}

export type OasAdapter = AdapterFactoryOptions<'oas', Options, ResolvedOptions>
