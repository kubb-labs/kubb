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
   * By default, the first JSON valid mediaType will be used
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
   * Choose to use `enum`, `asConst`, `asPascalConst`, `constEnum`, or `literal` for enums.
   * - `enum`: TypeScript enum
   * - `asConst`: const with camelCase name (e.g., `petType`)
   * - `asPascalConst`: const with PascalCase name (e.g., `PetType`)
   * - `constEnum`: const enum
   * - `literal`: literal union type
   * @default 'asConst'
   */
  enumType?: 'enum' | 'asConst' | 'asPascalConst' | 'constEnum' | 'literal'
  /**
   * Switch between type or interface for creating TypeScript types
   * @default 'type'
   */
  syntaxType?: 'type' | 'interface'
  /**
   * Set a suffix for the generated enums.
   * @default 'enum'
   */
  enumSuffix?: string
  /**
   * Inline enum types directly into the interface/type instead of exporting them separately.
   * When enabled, enum values will be inlined as literal union types in the property definition.
   * @default false
   * @note In Kubb v5, this will be the default behavior (true).
   */
  enumInline?: boolean
  /**
   * Choose to use `date` or `datetime` as JavaScript `Date` instead of `string`.
   * @default 'string'
   */
  dateType?: 'string' | 'date'
  /**
   * Which type to use when the Swagger/OpenAPI file is not providing more information.
   * @default 'any'
   */
  unknownType?: 'any' | 'unknown' | 'void'
  /**
   * Which type to use for empty schema values
   * @default `unknownType`
   */
  emptySchemaType?: 'any' | 'unknown' | 'void'
  /**
   * Choose what to use as mode for an optional value.
   * @examples 'questionToken': type?: string
   * @examples 'undefined': type: string | undefined
   * @examples 'questionTokenAndUndefined': type?: string | undefined
   * @default 'questionToken'
   */
  optionalType?: 'questionToken' | 'undefined' | 'questionTokenAndUndefined'
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
}

type ResolvedOptions = {
  output: Output<Oas>
  group: Options['group']
  override: NonNullable<Options['override']>
  enumType: NonNullable<Options['enumType']>
  enumSuffix: NonNullable<Options['enumSuffix']>
  enumInline: NonNullable<Options['enumInline']>
  dateType: NonNullable<Options['dateType']>
  unknownType: NonNullable<Options['unknownType']>
  emptySchemaType: NonNullable<Options['emptySchemaType']>
  optionalType: NonNullable<Options['optionalType']>
  transformers: NonNullable<Options['transformers']>
  syntaxType: NonNullable<Options['syntaxType']>
  mapper: Record<string, any>
}

export type PluginTs = PluginFactoryOptions<'plugin-ts', Options, ResolvedOptions, never, ResolvePathOptions>
