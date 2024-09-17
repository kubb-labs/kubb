import type { Output, PluginFactoryOptions, ResolveNameParams } from '@kubb/core'
import type { Exclude, Include, Override, ResolvePathOptions } from '@kubb/plugin-oas'
import type ts from 'typescript'

export type Options = {
  /**
   * @default 'types'
   */
  output?: Output
  /**
   * Group the TypeScript types based on the provided name.
   */
  group?: {
    /**
     * Tag will group based on the operation tag inside the Swagger file.
     */
    type: 'tag'
    /**
     * Relative path to save the grouped TypeScript Types.
     *
     * `{{tag}}` will be replaced by the current tagName.
     * @example `${output}/{{tag}}Controller` => `models/PetController`
     * @default `${output}/{{tag}}Controller`
     */
    output?: string
  }
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
   * Choose to use `enum` or `as const` for enums
   * @default 'asConst'
   * asPascalConst is deprecated
   */
  enumType?: 'enum' | 'asConst' | 'asPascalConst' | 'constEnum' | 'literal'
  /**
   * Set a suffix for the generated enums.
   * @default ''
   * Default will be `'enum'` in version 3 of Kubb
   */
  enumSuffix?: string

  /**
   * Choose to use `date` or `datetime` as JavaScript `Date` instead of `string`.
   * @default 'string'
   */
  dateType?: 'string' | 'date'
  /**
   * Which type to use when the Swagger/OpenAPI file is not providing more information.
   * @default 'any'
   */
  unknownType?: 'any' | 'unknown'
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
   * Export an Oas object as Oas type with `import type { Infer } from '@kubb/oas'`
   */
  oasType?: 'infer' | false
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
}

type ResolvedOptions = {
  output: Output
  override: NonNullable<Options['override']>
  enumType: NonNullable<Options['enumType']>
  enumSuffix: NonNullable<Options['enumSuffix']>
  dateType: NonNullable<Options['dateType']>
  unknownType: NonNullable<Options['unknownType']>
  optionalType: NonNullable<Options['optionalType']>
  transformers: NonNullable<Options['transformers']>
  oasType: NonNullable<Options['oasType']>
  usedEnumNames: Record<string, number>
  mapper: Record<string, any>
}

export type PluginTs = PluginFactoryOptions<'plugin-ts', Options, ResolvedOptions, never, ResolvePathOptions>
