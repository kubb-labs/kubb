import type { ParserOptions } from '@kubb/ast/types'
import type { AdapterFactoryOptions } from '@kubb/core'
import type { Oas as OasClass } from './oas/Oas.ts'
import type { contentType } from './oas/types.ts'

export type OasAdapterOptions = {
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
   * Which server to use from `oas.api.servers` when computing `baseURL`.
   * - `0` → first server, `1` → second server, etc.
   * - When omitted, `baseURL` in the resulting `RootNode.meta` is `undefined`.
   */
  serverIndex?: number
  /**
   * Override values for `{variable}` placeholders in the selected server URL.
   * Only used when `serverIndex` is set.
   *
   * @example
   * // spec server: "https://api.{env}.example.com"
   * serverVariables: { env: 'prod' }
   * // → baseURL: "https://api.prod.example.com"
   */
  serverVariables?: Record<string, string>
  /**
   * How the discriminator field should be interpreted.
   * - `'strict'`  — uses `oneOf` schemas as defined.
   * - `'inherit'` — replaces `oneOf` with the schema from `discriminator.mapping`.
   * @default 'strict'
   */
  discriminator?: 'strict' | 'inherit'
  /**
   * How `format: 'date-time'` schemas are represented in the AST.
   * - `'string'` maps to a `datetime` string node.
   * - `'date'` maps to a JavaScript `Date` node.
   * - `false` falls through to a plain `string` node.
   * @default 'string'
   */
} & Partial<ParserOptions>

export type OasAdapterResolvedOptions = {
  validate: boolean
  oasClass: OasAdapterOptions['oasClass']
  contentType: OasAdapterOptions['contentType']
  serverIndex: OasAdapterOptions['serverIndex']
  serverVariables: OasAdapterOptions['serverVariables']
  discriminator: NonNullable<OasAdapterOptions['discriminator']>
  dateType: NonNullable<OasAdapterOptions['dateType']>
  integerType: NonNullable<OasAdapterOptions['integerType']>
  unknownType: NonNullable<OasAdapterOptions['unknownType']>
  emptySchemaType: NonNullable<OasAdapterOptions['emptySchemaType']>
  enumSuffix: OasAdapterOptions['enumSuffix']
  /**
   * Map from original `$ref` paths to their collision-resolved schema names.
   * Populated by the adapter after each `parse()` call.
   * e.g. `'#/components/schemas/Order'` → `'OrderSchema'`
   */
  nameMapping: Map<string, string>
}

export type OasAdapter = AdapterFactoryOptions<'oas', OasAdapterOptions, OasAdapterResolvedOptions>
