import type { KubbFile, Plugin, PluginFactoryOptions, ResolveNameParams } from '@kubb/core'
import type { Exclude, Include, Override, ResolvePathOptions, SchemaMapper } from '@kubb/swagger'
import type { Operations } from './components/Operations'
import type { zodKeywordMapper } from './zodParser'

type Templates = {
  operations?: typeof Operations.templates | false
}

export type Options = {
  output?: {
    /**
     * Relative path to save the Zod schemas.
     * When output is a file it will save all models inside that file else it will create a file per schema item.
     * @default 'zod'
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
    /**
     * Define what needs to exported, here you can also disable the export of barrel files
     * @default `'barrel'`
     */
    exportType?: 'barrel' | 'barrelNamed' | false
  }
  /**
   * Group the Zod schemas based on the provided name.
   */
  group?: {
    /**
     * Tag will group based on the operation tag inside the Swagger file
     */
    type: 'tag'
    /**
     * Relative path to save the grouped Zod schemas.
     *
     * `{{tag}}` will be replaced by the current tagName.
     * @example `${output}/{{tag}}Controller` => `zod/PetController`
     * @default `${output}/{{tag}}Controller`
     */
    output?: string
    /**
     * Name to be used for the `export * as {{exportAs}} from './`
     * @default `"{{tag}}Schemas"`
     */
    exportAs?: string
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
  transformers?: {
    /**
     * Customize the names based on the type that is provided by the plugin.
     */
    name?: (name: ResolveNameParams['name'], type?: ResolveNameParams['type']) => string
  }
  mapper?: Partial<SchemaMapper>
  /**
   * Make it possible to override one of the templates
   */
  templates?: Partial<Templates>
  /**
   * Choose to use `date` or `datetime` as JavaScript `Date` instead of `string`.
   * @default 'string'
   */
  dateType?: 'string' | 'date'
  /**
   * Which type to use when the Swagger/OpenAPI file is not providing more information
   * @default 'any'
   */
  unknownType?: 'any' | 'unknown'
  /**
   * Use TypeScript(`@kubb/swagger-ts`) to add type annotation.
   */
  typed?: boolean
}

type ResolvedOptions = {
  transformers: NonNullable<Options['transformers']>
  exclude: Options['exclude']
  include: Options['include']
  override: Options['override']
  dateType: NonNullable<Options['dateType']>
  unknownType: NonNullable<Options['unknownType']>
  typed: NonNullable<Options['typed']>
  templates: NonNullable<Templates>
  mapper: NonNullable<SchemaMapper>
}

export type FileMeta = {
  pluginKey?: Plugin['key']
  tag?: string
}

export type PluginOptions = PluginFactoryOptions<'swagger-zod', Options, ResolvedOptions, never, ResolvePathOptions>

declare module '@kubb/core' {
  export interface _Register {
    ['@kubb/swagger-zod']: PluginOptions
  }
}
