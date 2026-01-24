import type { Group, Output, PluginFactoryOptions, ResolveNameParams } from '@kubb/core'
import type { contentType, Oas } from '@kubb/oas'
import type { Exclude, Include, Override, ResolvePathOptions } from '@kubb/plugin-oas'
import type { Generator } from '@kubb/plugin-oas/generators'
import type ts from 'typescript'

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
   * - 'inlineLiteral' inlines enum values directly into the type (default in v5).
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
   * Set a suffix for the generated enums.
   * @default 'enum'
   */
  enumSuffix?: string
  /**
   * Choose to use date or datetime as JavaScript Date instead of string.
   * - 'string' represents dates as string values.
   * - 'date' represents dates as JavaScript Date objects.
   * @default 'string'
   */
  dateType?: 'string' | 'date'
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
  transformers?: {
    /**
     * Customize the names based on the type that is provided by the plugin.
     */
    name?: (name: ResolveNameParams['name'], type?: ResolveNameParams['type']) => string
  }
  /**
   * @example
   * Use https://ts-ast-viewer.com to generate factory code(see createPropertySignature)
   * category: factory.createPropertySignature(
   *   undefined,
   *   factory.createIdentifier("category"),
   *   factory.createToken(ts.SyntaxKind.QuestionToken),
   *   factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword)
   * )
   */
  mapper?: Record<string, ts.PropertySignature>
  /**
   * Define some generators next to the ts generators
   */
  generators?: Array<Generator<PluginTs>>
  /**
   * Unstable naming for v5
   */
  UNSTABLE_NAMING?: true
}

type ResolvedOptions = {
  output: Output<Oas>
  group: Options['group']
  override: NonNullable<Options['override']>
  enumType: NonNullable<Options['enumType']>
  enumKeyCasing: NonNullable<Options['enumKeyCasing']>
  enumSuffix: NonNullable<Options['enumSuffix']>
  dateType: NonNullable<Options['dateType']>
  unknownType: NonNullable<Options['unknownType']>
  emptySchemaType: NonNullable<Options['emptySchemaType']>
  optionalType: NonNullable<Options['optionalType']>
  arrayType: NonNullable<Options['arrayType']>
  transformers: NonNullable<Options['transformers']>
  syntaxType: NonNullable<Options['syntaxType']>
  mapper: Record<string, any>
}

export type PluginTs = PluginFactoryOptions<'plugin-ts', Options, ResolvedOptions, never, ResolvePathOptions>
