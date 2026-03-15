import type { AdapterFactoryOptions } from '@kubb/core'
import type { DevtoolsOptions } from './devtools.ts'
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
  /**
   * Enable visual AST inspection via Kubb Studio.
   *
   * - `true` — opens `https://studio.kubb.dev/ast?root=<encoded>` after every `parse()`.
   * - `{ studioUrl }` — same, with a custom Studio URL (e.g. your self-hosted instance).
   *
   * Logs the URL to the console so you can click/open it during development or CI.
   */
  devtools?: boolean | DevtoolsOptions
}

export type OasAdapterResolvedOptions = {
  validate: boolean
  oasClass: OasAdapterOptions['oasClass']
  contentType: OasAdapterOptions['contentType']
  serverIndex: OasAdapterOptions['serverIndex']
  serverVariables: OasAdapterOptions['serverVariables']
  discriminator: NonNullable<OasAdapterOptions['discriminator']>
  collisionDetection: boolean
  dateType: NonNullable<OasAdapterOptions['dateType']>
  integerType: NonNullable<OasAdapterOptions['integerType']>
  unknownType: NonNullable<OasAdapterOptions['unknownType']>
  emptySchemaType: NonNullable<OasAdapterOptions['emptySchemaType']>
  devtools: OasAdapterOptions['devtools']
}

export type OasAdapter = AdapterFactoryOptions<'oas', OasAdapterOptions, OasAdapterResolvedOptions>
