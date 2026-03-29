import type { OperationParamsResolver } from '@kubb/ast'
import type { OperationNode, ParameterNode, SchemaNode, StatusCode, Visitor } from '@kubb/ast/types'
import type {
  CompatibilityPreset,
  Exclude,
  Generator,
  Group,
  Include,
  Output,
  Override,
  PluginFactoryOptions,
  ResolvePathOptions,
  Resolver,
  UserGroup,
} from '@kubb/core'

/**
 * The concrete resolver type for `@kubb/plugin-zod`.
 * Extends the base `Resolver` with zod-specific naming helpers.
 */
export type ResolverZod = Resolver &
  OperationParamsResolver & {
    /** Resolve a camelCase schema name with 'Schema' suffix. */
    resolveName(name: string): string
    /** Resolve a path/file name for the generated output. */
    resolvePathName(name: string, type?: 'file' | 'function' | 'type' | 'const'): string
    /**
     * Resolves the name for an operation response by status code.
     *
     * @example
     * resolver.resolveResponseStatusName(node, 200) // → 'listPetsStatus200Schema'
     */
    resolveResponseStatusName(node: OperationNode, statusCode: StatusCode): string
    /**
     * Resolves the name for the collection of all operation responses.
     *
     * @example
     * resolver.resolveResponsesName(node) // → 'listPetsResponsesSchema'
     */
    resolveResponsesName(node: OperationNode): string
    /**
     * Resolves the name for the union of all operation responses.
     *
     * @example
     * resolver.resolveResponseName(node) // → 'listPetsResponseSchema'
     */
    resolveResponseName(node: OperationNode): string
    /**
     * Resolves the name for an operation's grouped path parameters type.
     *
     * @example
     * resolver.resolvePathParamsName(node, param) // → 'deletePetPathPetIdSchema'
     */
    resolvePathParamsName(node: OperationNode, param: ParameterNode): string
    /**
     * Resolves the name for an operation's grouped query parameters type.
     *
     * @example
     * resolver.resolveQueryParamsName(node, param) // → 'findPetsByStatusQueryStatusSchema'
     */
    resolveQueryParamsName(node: OperationNode, param: ParameterNode): string
    /**
     * Resolves the name for an operation's grouped header parameters type.
     *
     * @example
     * resolver.resolveHeaderParamsName(node, param) // → 'deletePetHeaderApiKeySchema'
     */
    resolveHeaderParamsName(node: OperationNode, param: ParameterNode): string
  }

export type Options = {
  /**
   * @default 'zod'
   */
  output?: Output
  /**
   * Group the Zod schemas based on the provided name.
   */
  group?: UserGroup
  /**
   * Array containing exclude parameters to exclude/skip tags/operations/methods/paths.
   */
  exclude?: Array<Exclude>
  /**
   * Array containing include parameters to include tags/operations/methods/paths.
   */
  include?: Array<Include>
  /**
   * Array containing override parameters to override `options` based on tags/operations/methods/paths.
   */
  override?: Array<Override<ResolvedOptions>>
  /**
   * Path to Zod
   * It used as `import { z } from '${importPath}'`.
   * Accepts relative and absolute paths.
   * Path is used as-is; relative paths are based on the generated file location.
   * @default 'zod'
   */
  importPath?: string
  /**
   * Choose to use date or datetime as JavaScript Date instead of string.
   * - false falls back to a simple z.string() format.
   * - 'string' uses z.string().datetime() for datetime validation.
   * - 'stringOffset' uses z.string().datetime({ offset: true }) for datetime with timezone offset validation.
   * - 'stringLocal' uses z.string().datetime({ local: true }) for local datetime validation.
   * - 'date' uses z.date() for JavaScript Date objects.
   * @default 'string'
   */
  dateType?: false | 'string' | 'stringOffset' | 'stringLocal' | 'date'
  /**
   * Choose to use `number` or `bigint` for integer fields with `int64` format.
   * - 'number' uses the JavaScript `number` type (matches JSON.parse() runtime behavior).
   * - 'bigint' uses the JavaScript `bigint` type (accurate for values exceeding Number.MAX_SAFE_INTEGER).
   * @default 'bigint'
   */
  integerType?: 'number' | 'bigint'
  /**
   * Which type to use when the Swagger/OpenAPI file is not providing more information.
   * - 'any' allows any value.
   * - 'unknown' requires type narrowing before use.
   * - 'void' represents no value.
   * @default 'any'
   */
  unknownType?: 'any' | 'unknown' | 'void'
  /**
   * Which type to use for empty schema values.
   * - 'any' allows any value.
   * - 'unknown' requires type narrowing before use.
   * - 'void' represents no value.
   * @default `unknownType`
   */
  emptySchemaType?: 'any' | 'unknown' | 'void'
  /**
   * Use TypeScript(`@kubb/plugin-ts`) to add type annotation.
   */
  typed?: boolean
  /**
   * Return Zod generated schema as type with z.infer<TYPE>
   */
  inferred?: boolean
  /**
   * Use of z.coerce.string() instead of z.string().
   * Can also be an object to enable coercion for dates, strings, and numbers.
   */
  coercion?: boolean | { dates?: boolean; strings?: boolean; numbers?: boolean }
  /**
   * Generate operation-level schemas (grouped by operationId).
   */
  operations?: boolean
  /**
   * Which Zod GUID validator to use for OpenAPI `format: uuid`.
   * - 'uuid' uses UUID validation.
   * - 'guid' uses GUID validation.
   * @default 'uuid'
   */
  guidType?: 'uuid' | 'guid'
  /**
   * Use Zod Mini's functional API for better tree-shaking support.
   * When enabled, generates functional syntax (e.g., `z.optional(z.string())`)
   * instead of chainable methods (e.g., `z.string().optional()`).
   * When `mini: true`, `importPath` will default to 'zod/mini'.
   * @default false
   */
  mini?: boolean
  /**
   * Callback function to wrap the output of the generated zod schema.
   *
   * Useful for edge cases like adding `.openapi()` metadata or wrapping
   * schemas with extension helpers (openapi -> zod -> openapi round-trips).
   */
  wrapOutput?: (arg: { output: string; schema: SchemaNode }) => string | undefined
  /**
   * How to style your params, by default no casing is applied
   * - 'camelcase' uses camelCase for pathParams, queryParams and headerParams property names
   * @default undefined
   */
  paramsCasing?: 'camelcase'
  /**
   * Define additional generators next to the zod generators.
   */
  generators?: Array<Generator<PluginZod>>
  /**
   * Compatibility preset to ease migration from previous Kubb versions.
   */
  compatibilityPreset?: CompatibilityPreset
  /**
   * Custom resolver instances for zod-specific name resolution.
   */
  resolvers?: Array<ResolverZod>
  /**
   * AST visitor transformers applied during code generation.
   */
  transformers?: Array<Visitor>
}

type ResolvedOptions = {
  output: Output
  group: Group | undefined
  dateType: NonNullable<Options['dateType']>
  integerType: NonNullable<Options['integerType']>
  unknownType: NonNullable<Options['unknownType']>
  emptySchemaType: NonNullable<Options['emptySchemaType']>
  typed: NonNullable<Options['typed']>
  inferred: NonNullable<Options['inferred']>
  importPath: NonNullable<Options['importPath']>
  coercion: NonNullable<Options['coercion']>
  operations: NonNullable<Options['operations']>
  guidType: NonNullable<Options['guidType']>
  mini: NonNullable<Options['mini']>
  wrapOutput: Options['wrapOutput']
  paramsCasing: Options['paramsCasing']
  transformers: Array<Visitor>
}

export type PluginZod = PluginFactoryOptions<'plugin-zod', Options, ResolvedOptions, never, ResolvePathOptions, ResolverZod>
