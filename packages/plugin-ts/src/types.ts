import type { OperationParamsResolver } from '@kubb/ast'
import type { OperationNode, ParameterNode, StatusCode, Visitor } from '@kubb/ast/types'
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
 * The concrete resolver type for `@kubb/plugin-ts`.
 * Extends the base `Resolver` (which provides `default` and `resolveOptions`) with
 * plugin-specific naming helpers for operations, parameters, responses, and schemas.
 */
export type ResolverTs = Resolver &
  OperationParamsResolver & {
    /**
     * Resolves the name for a given raw name (equivalent to `default(name, 'function')`).
     * Since TypeScript only emits types, this is the canonical naming method.
     *
     * @example
     * resolver.resolveName('list pets status 200') // → 'ListPetsStatus200'
     */
    resolveName(name: string): string
    /**
     * Resolves the file/path name for a given identifier using PascalCase.
     *
     * @example
     * resolver.resolvePathName('list pets', 'file') // → 'ListPets'
     */
    resolvePathName(name: string, type?: 'file' | 'function' | 'type' | 'const'): string
    /**
     * Resolves the request body type name for an operation (required on ResolverTs).
     */
    resolveDataName(node: OperationNode): string

    /**
     * Resolves the name for an operation response by status code.
     * Encapsulates the `<operationId> Status <statusCode>` template with PascalCase applied to the result.
     *
     * @example
     * resolver.resolveResponseStatusName(node, 200) // → 'ListPetsStatus200'
     */
    resolveResponseStatusName(node: OperationNode, statusCode: StatusCode): string
    /**
     * Resolves the name for an operation's request config (`RequestConfig`).
     *
     * @example
     * resolver.resolveRequestConfigName(node) // → 'ListPetsRequestConfig'
     */
    resolveRequestConfigName(node: OperationNode): string
    /**
     * Resolves the name for the collection of all operation responses (`Responses`).
     *
     * @example
     * resolver.resolveResponsesName(node) // → 'ListPetsResponses'
     */
    resolveResponsesName(node: OperationNode): string
    /**
     * Resolves the name for the union of all operation responses (`Response`).
     *
     * @example
     * resolver.resolveResponseName(node) // → 'ListPetsResponse'
     */
    resolveResponseName(node: OperationNode): string
    /**
     * Resolves the TypeScript type alias name for an enum schema's key variant.
     * Appends `enumTypeSuffix` (default `'Key'`) after applying the default naming convention.
     *
     * @example
     * resolver.resolveEnumKeyName(node, 'Key')   // → 'PetStatusKey'
     * resolver.resolveEnumKeyName(node, 'Value') // → 'PetStatusValue'
     * resolver.resolveEnumKeyName(node, '')      // → 'PetStatus'
     */
    resolveEnumKeyName(node: { name?: string | null }, enumTypeSuffix: string): string
    /**
     * Resolves the name for an operation's grouped path parameters type.
     *
     * @example
     * resolver.resolvePathParamsName(node, param) // → 'GetPetByIdPathParams'
     */
    resolvePathParamsName(node: OperationNode, param: ParameterNode): string
    /**
     * Resolves the name for an operation's grouped query parameters type.
     *
     * @example
     * resolver.resolveQueryParamsName(node, param) // → 'FindPetsByStatusQueryParams'
     */
    resolveQueryParamsName(node: OperationNode, param: ParameterNode): string
    /**
     * Resolves the name for an operation's grouped header parameters type.
     *
     * @example
     * resolver.resolveHeaderParamsName(node, param) // → 'DeletePetHeaderParams'
     */
    resolveHeaderParamsName(node: OperationNode, param: ParameterNode): string
  }

type EnumKeyCasing = 'screamingSnakeCase' | 'snakeCase' | 'pascalCase' | 'camelCase' | 'none'

/**
 * Discriminated union that ties `enumTypeSuffix` and `enumKeyCasing` to the enum types that actually use them.
 *
 * - `'asConst'` / `'asPascalConst'` — emit a `const` object; both `enumTypeSuffix` (type-alias suffix) and
 *    `enumKeyCasing` (key formatting) are meaningful.
 * - `'enum'` / `'constEnum'` — emit a TypeScript enum; `enumKeyCasing` applies to member names,
 *    but there is no separate type alias so `enumTypeSuffix` is not used.
 * - `'literal'` / `'inlineLiteral'` — emit only union literals; keys are discarded entirely,
 *    so neither `enumTypeSuffix` nor `enumKeyCasing` have any effect.
 */
type EnumTypeOptions =
  | {
      /**
       * Choose to use enum, asConst, asPascalConst, constEnum, literal, or inlineLiteral for enums.
       * - 'asConst' generates const objects with camelCase names and as const assertion.
       * - 'asPascalConst' generates const objects with PascalCase names and as const assertion.
       * @default 'asConst'
       */
      enumType?: 'asConst' | 'asPascalConst'
      /**
       * Suffix appended to the generated type alias name.
       *
       * Only affects the type alias — the const object name is unchanged.
       *
       * @default 'Key'
       * @example enumTypeSuffix: 'Value' → `export type PetStatusValue = …`
       */
      enumTypeSuffix?: string
      /**
       * Choose the casing for enum key names.
       * - 'screamingSnakeCase' generates keys in SCREAMING_SNAKE_CASE format.
       * - 'snakeCase' generates keys in snake_case format.
       * - 'pascalCase' generates keys in PascalCase format.
       * - 'camelCase' generates keys in camelCase format.
       * - 'none' uses the enum value as-is without transformation.
       * @default 'none'
       */
      enumKeyCasing?: EnumKeyCasing
    }
  | {
      /**
       * Choose to use enum, asConst, asPascalConst, constEnum, literal, or inlineLiteral for enums.
       * - 'enum' generates TypeScript enum declarations.
       * - 'constEnum' generates TypeScript const enum declarations.
       * @default 'asConst'
       */
      enumType?: 'enum' | 'constEnum'
      /**
       * `enumTypeSuffix` has no effect for this `enumType`.
       * It is only used when `enumType` is `'asConst'` or `'asPascalConst'`.
       */
      enumTypeSuffix?: never
      /**
       * Choose the casing for enum key names.
       * - 'screamingSnakeCase' generates keys in SCREAMING_SNAKE_CASE format.
       * - 'snakeCase' generates keys in snake_case format.
       * - 'pascalCase' generates keys in PascalCase format.
       * - 'camelCase' generates keys in camelCase format.
       * - 'none' uses the enum value as-is without transformation.
       * @default 'none'
       */
      enumKeyCasing?: EnumKeyCasing
    }
  | {
      /**
       * Choose to use enum, asConst, asPascalConst, constEnum, literal, or inlineLiteral for enums.
       * - 'literal' generates literal union types.
       * - 'inlineLiteral' inlines enum values directly into the type (default in v5).
       * @default 'asConst'
       * @note In Kubb v5, 'inlineLiteral' becomes the default.
       */
      enumType?: 'literal' | 'inlineLiteral'
      /**
       * `enumTypeSuffix` has no effect for this `enumType`.
       * It is only used when `enumType` is `'asConst'` or `'asPascalConst'`.
       */
      enumTypeSuffix?: never
      /**
       * `enumKeyCasing` has no effect for this `enumType`.
       * Literal and inlineLiteral modes emit only values — keys are discarded entirely.
       */
      enumKeyCasing?: never
    }

export type Options = {
  /**
   * Specify the export location for the files and define the behavior of the output
   * @default { path: 'types', barrelType: 'named' }
   */
  output?: Output
  /**
   * Define which contentType should be used.
   * By default, uses the first valid JSON media type.
   */
  contentType?: 'application/json' | (string & {})
  /**
   * Group the clients based on the provided name.
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
   * Switch between type or interface for creating TypeScript types.
   * - 'type' generates type alias declarations.
   * - 'interface' generates interface declarations.
   * @default 'type'
   */
  syntaxType?: 'type' | 'interface'
  /**
   * Choose what to use as mode for an optional value.
   * - 'questionToken' marks the property as optional with ? (e.g., type?: string).
   * - 'undefined' adds undefined to the type union (e.g., type: string | undefined).
   * - 'questionTokenAndUndefined' combines both approaches (e.g., type?: string | undefined).
   * @default 'questionToken'
   */
  optionalType?: 'questionToken' | 'undefined' | 'questionTokenAndUndefined'
  /**
   * Choose between Array<string> or string[] for array types.
   * - 'generic' generates Array<Type> syntax.
   * - 'array' generates Type[] syntax.
   * @default 'array'
   */
  arrayType?: 'generic' | 'array'
  /**
   * How to style your params, by default no casing is applied
   * - 'camelcase' uses camelCase for pathParams, queryParams and headerParams property names
   * @default undefined
   * @note response types (data/body) are NOT affected by this option
   */
  paramsCasing?: 'camelcase'
  /**
   * Define some generators next to the ts generators
   */
  generators?: Array<Generator<PluginTs>>
  /**
   * Apply a compatibility naming preset.
   * Use `kubbV4` for strict v4 type-generation compatibility.
   * You can further customize naming with `resolvers`.
   * @default 'default'
   */
  compatibilityPreset?: CompatibilityPreset
  /**
   * Array of named resolvers that control naming conventions.
   * Later entries override earlier ones (last wins).
   * Built-in: `resolverTs` (default), `resolverTsLegacy`.
   * @default [resolverTs]
   */
  resolvers?: Array<ResolverTs>
  /**
   * Array of AST visitors applied to each SchemaNode/OperationNode before printing.
   * Uses `transform()` from `@kubb/ast` — visitors can modify, replace, or annotate nodes.
   *
   * @example Remove writeOnly properties from response types
   * ```ts
   * transformers: [{
   *   property(node) {
   *     if (node.schema.writeOnly) return undefined
   *   }
   * }]
   * ```
   *
   * @example Force all dates to plain strings
   * ```ts
   * transformers: [{
   *   schema(node) {
   *     if (node.type === 'date') return { ...node, type: 'string' }
   *   }
   * }]
   * ```
   */
  transformers?: Array<Visitor>
} & EnumTypeOptions

type ResolvedOptions = {
  output: Output
  group: Group | undefined
  enumType: NonNullable<Options['enumType']>
  enumTypeSuffix: NonNullable<Options['enumTypeSuffix']>
  enumKeyCasing: EnumKeyCasing
  optionalType: NonNullable<Options['optionalType']>
  arrayType: NonNullable<Options['arrayType']>
  syntaxType: NonNullable<Options['syntaxType']>
  paramsCasing: Options['paramsCasing']
  transformers: Array<Visitor>
}

export type PluginTs = PluginFactoryOptions<'plugin-ts', Options, ResolvedOptions, never, ResolvePathOptions, ResolverTs>
