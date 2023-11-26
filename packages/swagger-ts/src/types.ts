import type { KubbFile, KubbPlugin, PluginFactoryOptions, ResolveNameParams } from '@kubb/core'
import type { AppMeta as SwaggerAppMeta, Exclude, Include, Override, ResolvePathOptions } from '@kubb/swagger'

export type Options = {
  output?: {
    /**
     * Relative path to save the TypeScript types.
     * When output is a file it will save all models inside that file else it will create a file per schema item.
     * @default 'types'
     */
    path: string
    /**
     * Name to be used for the `export * as {{exportAs}} from './'`
     */
    exportAs?: string
    /**
     * Add an extension to the generated imports and exports, default it will not use an extension
     */
    extName?: KubbFile.Extname
  }
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
   * Array containing exclude paramaters to exclude/skip tags/operations/methods/paths.
   */
  exclude?: Array<Exclude>
  /**
   * Array containing include paramaters to include tags/operations/methods/paths.
   */
  include?: Array<Include>
  /**
   * Array containing override paramaters to override `options` based on tags/operations/methods/paths.
   */
  override?: Array<Override<Options>>
  /**
   * Choose to use `enum` or `as const` for enums
   * @default 'asConst'
   */
  enumType?: 'enum' | 'asConst' | 'asPascalConst'
  /**
   * Choose to use `date` or `datetime` as JavaScript `Date` instead of `string`.
   * @default 'string'
   */
  dateType?: 'string' | 'date'
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
   * Export Oas object as Oas type with import type { Infer } from `@kubb/swagger-ts/infer`
   * TODO add docs
   * @beta
   */
  oasType?: boolean
}

type ResolvedOptions = {
  enumType: NonNullable<Options['enumType']>
  dateType: NonNullable<Options['dateType']>
  optionalType: NonNullable<Options['optionalType']>
  transformers: NonNullable<Options['transformers']>
  oasType: NonNullable<Options['oasType']>
  usedEnumNames: Record<string, number>
}

export type FileMeta = {
  pluginKey?: KubbPlugin['key']
  name?: string
  tag?: string
}

type AppMeta = SwaggerAppMeta

export type PluginOptions = PluginFactoryOptions<'swagger-ts', Options, ResolvedOptions, never, ResolvePathOptions, AppMeta>

declare module '@kubb/core' {
  export interface _Register {
    ['@kubb/swagger-ts']: PluginOptions
  }
}
// external packages
export * as Infer from './infer/index.ts'
