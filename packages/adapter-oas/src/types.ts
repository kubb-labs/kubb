import type { ParserOptions } from '@kubb/ast/types'
import type { AdapterFactoryOptions } from '@kubb/core'
import type { contentType } from './oas/types.ts'

/**
 * User-facing options for `adapterOas(...)`.
 *
 * Extends `ParserOptions` from `@kubb/ast` with adapter-specific controls
 * like spec validation and server URL selection.
 *
 * @example
 * ```ts
 * adapterOas({
 *   validate: false,
 *   dateType: 'date',
 *   serverIndex: 0,
 *   serverVariables: { env: 'prod' },
 * })
 * ```
 */
export type OasAdapterOptions = {
  /**
   * Validate the OpenAPI spec before parsing.
   * @default true
   */
  validate?: boolean
  /**
   * Preferred content-type used when extracting request/response schemas.
   * Defaults to the first valid JSON media type found in the spec.
   */
  contentType?: contentType
  /**
   * Index into `oas.api.servers` for computing `baseURL`.
   * `0` → first server, `1` → second server. Omit to leave `baseURL` undefined.
   */
  serverIndex?: number
  /**
   * Override values for `{variable}` placeholders in the selected server URL.
   * Only used when `serverIndex` is set.
   *
   * @example
   * ```ts
   * // spec server: "https://api.{env}.example.com"
   * serverVariables: { env: 'prod' }
   * // → baseURL: "https://api.prod.example.com"
   * ```
   */
  serverVariables?: Record<string, string>
  /**
   * How the discriminator field is interpreted.
   * - `'strict'`  — uses `oneOf` schemas as written in the spec.
   * - `'inherit'` — propagates discriminator values into child schemas from `discriminator.mapping`.
   * @default 'strict'
   */
  discriminator?: 'strict' | 'inherit'
} & Partial<ParserOptions>

/**
 * Resolved adapter options available at runtime after defaults have been applied.
 */
export type OasAdapterResolvedOptions = {
  validate: boolean
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
   * Populated after each `parse()` call.
   *
   * @example
   * ```ts
   * nameMapping.get('#/components/schemas/Order') // 'Order'
   * nameMapping.get('#/components/responses/Order') // 'OrderResponse'
   * ```
   */
  nameMapping: Map<string, string>
}

/**
 * `@kubb/core` adapter factory type for the OpenAPI adapter.
 */
export type OasAdapter = AdapterFactoryOptions<'oas', OasAdapterOptions, OasAdapterResolvedOptions>
