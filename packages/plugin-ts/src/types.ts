import type { OperationNode, ParameterNode, SchemaNode, StatusCode, Visitor } from '@kubb/ast/types'
import type { Group, Output, PluginFactoryOptions, Resolver } from '@kubb/core'
import type { contentType, Oas } from '@kubb/oas'
import type { Exclude, Include, Override, ResolvePathOptions } from '@kubb/plugin-oas'
import type { Generator } from '@kubb/plugin-oas/generators'

/**
 * The concrete resolver type for `@kubb/plugin-ts`.
 * Extends the base `Resolver` (which provides `default` and `resolveOptions`) with
 * plugin-specific naming helpers for operations, parameters, responses, and schemas.
 */
export type ResolverTs = Resolver & {
  /**
   * Resolves the variable/function name for a given raw name (equivalent to `default(name, 'function')`).
   * Use this shorthand when matching the `name` field produced by the v2 TypeGenerator,
   * so call-sites don't need to repeat the `'function'` type literal.
   *
   * @example
   * resolver.resolveName('list pets status 200') // → 'listPetsStatus200'
   */
  resolveName(name: string): string
  /**
   * Resolves the TypeScript type name for a given raw name (equivalent to `default(name, 'type')`).
   * Use this shorthand when matching the `typedName` field produced by the v2 TypeGenerator,
   * so call-sites don't need to repeat the `'type'` type literal.
   *
   * @example
   * resolver.resolveTypedName('list pets status 200') // → 'ListPetsStatus200'
   */
  resolveTypedName(name: string): string
  /**
   * Resolves the file/path name for a given identifier using PascalCase.
   *
   * @example
   * resolver.resolvePathName('list pets', 'file') // → 'ListPets'
   */
  resolvePathName(name: string, type?: 'file' | 'function' | 'type' | 'const'): string
  /**
   * Resolves the variable/function name for an operation parameter.
   * Encapsulates the `<operationId> <PascalCase(paramIn)> <paramName>` naming convention.
   *
   * @example
   * resolver.resolveParamName(node, param) // → 'ListPetsQueryLimit'
   */
  resolveParamName(node: OperationNode, param: ParameterNode): string
  /**
   * Resolves the TypeScript type alias name for an operation parameter
   * (equivalent to `resolveParamName` with `type: 'type'`).
   * In the default implementation both return the same PascalCase string;
   * the distinction is preserved so overrides can diverge the two forms.
   *
   * @example
   * resolver.resolveParamTypedName(node, param) // → 'ListPetsQueryLimit'
   */
  resolveParamTypedName(node: OperationNode, param: ParameterNode): string
  /**
   * Resolves the variable/function name for an operation response by status code.
   * Encapsulates the `<operationId> Status <statusCode>` template with PascalCase applied to the result.
   *
   * @example
   * resolver.resolveResponseStatusName(node, 200) // → 'ListPetsStatus200'
   */
  resolveResponseStatusName(node: OperationNode, statusCode: StatusCode): string
  /**
   * Resolves the TypeScript type alias name for an operation response by status code.
   * Encapsulates the `<operationId> Status <statusCode>` template with PascalCase applied to the result.
   *
   * @example
   * resolver.resolveResponseStatusTypedName(node, 200) // → 'ListPetsStatus200'
   */
  resolveResponseStatusTypedName(node: OperationNode, statusCode: StatusCode): string
  /**
   * Resolves the variable/function name for an operation's request body (`Data`).
   *
   * @example
   * resolver.resolveDataName(node) // → 'ListPetsData'
   */
  resolveDataName(node: OperationNode): string
  /**
   * Resolves the TypeScript type alias name for an operation's request body (`Data`).
   *
   * @example
   * resolver.resolveDataTypedName(node) // → 'ListPetsData'
   */
  resolveDataTypedName(node: OperationNode): string
  /**
   * Resolves the variable/function name for an operation's request config (`RequestConfig`).
   *
   * @example
   * resolver.resolveRequestConfigName(node) // → 'ListPetsRequestConfig'
   */
  resolveRequestConfigName(node: OperationNode): string
  /**
   * Resolves the TypeScript type alias name for an operation's request config (`RequestConfig`).
   *
   * @example
   * resolver.resolveRequestConfigTypedName(node) // → 'ListPetsRequestConfig'
   */
  resolveRequestConfigTypedName(node: OperationNode): string
  /**
   * Resolves the variable/function name for the collection of all operation responses (`Responses`).
   *
   * @example
   * resolver.resolveResponsesName(node) // → 'ListPetsResponses'
   */
  resolveResponsesName(node: OperationNode): string
  /**
   * Resolves the TypeScript type alias name for the collection of all operation responses.
   *
   * @example
   * resolver.resolveResponsesTypedName(node) // → 'ListPetsResponses'
   */
  resolveResponsesTypedName(node: OperationNode): string
  /**
   * Resolves the variable/function name for the union of all operation responses (`Response`).
   *
   * @example
   * resolver.resolveResponseName(node) // → 'ListPetsResponse'
   */
  resolveResponseName(node: OperationNode): string
  /**
   * Resolves the TypeScript type alias name for the union of all operation responses.
   *
   * @example
   * resolver.resolveResponseTypedName(node) // → 'ListPetsResponse'
   */
  resolveResponseTypedName(node: OperationNode): string
  /**
   * Resolves the TypeScript type alias name for an enum schema's key variant.
   * Appends the `Key` suffix after applying the default naming convention.
   *
   * @example
   * resolver.resolveEnumKeyTypedName(node) // → 'PetStatusKey'
   */
  resolveEnumKeyTypedName(node: SchemaNode): string
  /**
   * Resolves the variable/function name for an operation's grouped path parameters type.
   * Only available in legacy mode (`legacy: true`).
   *
   * @deprecated Legacy only — will be removed in v6. Use `resolveParamName` per individual parameter instead.
   * @example
   * resolver.resolvePathParamsName(node) // → 'GetPetByIdPathParams'
   */
  resolvePathParamsName?(node: OperationNode): string
  /**
   * Resolves the TypeScript type alias name for an operation's grouped path parameters type.
   * Only available in legacy mode (`legacy: true`).
   *
   * @deprecated Legacy only — will be removed in v6. Use `resolveParamTypedName` per individual parameter instead.
   * @example
   * resolver.resolvePathParamsTypedName(node) // → 'GetPetByIdPathParams'
   */
  resolvePathParamsTypedName?(node: OperationNode): string
  /**
   * Resolves the variable/function name for an operation's grouped query parameters type.
   * Only available in legacy mode (`legacy: true`).
   *
   * @deprecated Legacy only — will be removed in v6. Use `resolveParamName` per individual parameter instead.
   * @example
   * resolver.resolveQueryParamsName(node) // → 'FindPetsByStatusQueryParams'
   */
  resolveQueryParamsName?(node: OperationNode): string
  /**
   * Resolves the TypeScript type alias name for an operation's grouped query parameters type.
   * Only available in legacy mode (`legacy: true`).
   *
   * @deprecated Legacy only — will be removed in v6. Use `resolveParamTypedName` per individual parameter instead.
   * @example
   * resolver.resolveQueryParamsTypedName(node) // → 'FindPetsByStatusQueryParams'
   */
  resolveQueryParamsTypedName?(node: OperationNode): string
  /**
   * Resolves the variable/function name for an operation's grouped header parameters type.
   * Only available in legacy mode (`legacy: true`).
   *
   * @deprecated Legacy only — will be removed in v6. Use `resolveParamName` per individual parameter instead.
   * @example
   * resolver.resolveHeaderParamsName(node) // → 'DeletePetHeaderParams'
   */
  resolveHeaderParamsName?(node: OperationNode): string
  /**
   * Resolves the TypeScript type alias name for an operation's grouped header parameters type.
   * Only available in legacy mode (`legacy: true`).
   *
   * @deprecated Legacy only — will be removed in v6. Use `resolveParamTypedName` per individual parameter instead.
   * @example
   * resolver.resolveHeaderParamsTypedName(node) // → 'DeletePetHeaderParams'
   */
  resolveHeaderParamsTypedName?(node: OperationNode): string
}

export type Options = {
  /**
   * Specify the export location for the files and define the behavior of the output
   * @default { path: 'types', barrelType: 'named' }
   */
  output?: Output<Oas>
  /**
   * Define which contentType should be used.
   * By default, uses the first valid JSON media type.
   */
  contentType?: contentType
  /**
   * Group the clients based on the provided name.
   */
  group?: Group
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
   * Choose to use enum, asConst, asPascalConst, constEnum, literal, or inlineLiteral for enums.
   * - 'enum' generates TypeScript enum declarations.
   * - 'asConst' generates const objects with camelCase names and as const assertion.
   * - 'asPascalConst' generates const objects with PascalCase names and as const assertion.
   * - 'constEnum' generates TypeScript const enum declarations.
   * - 'literal' generates literal union types.
   * - 'inlineLiteral' inline enum values directly into the type (default in v5).
   * @default 'asConst'
   * @note In Kubb v5, 'inlineLiteral' becomes the default.
   */
  enumType?: 'enum' | 'asConst' | 'asPascalConst' | 'constEnum' | 'literal' | 'inlineLiteral'
  /**
   * Choose the casing for enum key names.
   * - 'screamingSnakeCase' generates keys in SCREAMING_SNAKE_CASE format.
   * - 'snakeCase' generates keys in snake_case format.
   * - 'pascalCase' generates keys in PascalCase format.
   * - 'camelCase' generates keys in camelCase format.
   * - 'none' uses the enum value as-is without transformation.
   * @default 'none'
   */
  enumKeyCasing?: 'screamingSnakeCase' | 'snakeCase' | 'pascalCase' | 'camelCase' | 'none'
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
   * Unstable naming for v5
   */
  UNSTABLE_NAMING?: true
  /**
   * Enable legacy naming conventions for backwards compatibility.
   * @default false
   */
  legacy?: boolean
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
}

type ResolvedOptions = {
  output: Output<Oas>
  group: Options['group']
  override: NonNullable<Options['override']>
  enumType: NonNullable<Options['enumType']>
  enumKeyCasing: NonNullable<Options['enumKeyCasing']>
  optionalType: NonNullable<Options['optionalType']>
  arrayType: NonNullable<Options['arrayType']>
  syntaxType: NonNullable<Options['syntaxType']>
  paramsCasing: Options['paramsCasing']
  resolver: ResolverTs
  /**
   * The resolver without user naming overrides applied.
   * Used internally to derive stable names for unnamed enums and grouped params
   * so that the schema tree stays consistent regardless of `transformers.name` / custom resolvers.
   */
  baseResolver: ResolverTs
  transformers: Array<Visitor>
}

export type PluginTs = PluginFactoryOptions<'plugin-ts', Options, ResolvedOptions, never, ResolvePathOptions, ResolverTs>
