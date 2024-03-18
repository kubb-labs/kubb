import type { KubbFile, Plugin, PluginFactoryOptions, ResolveNameParams } from '@kubb/core'
import type { Exclude, Include, Override, ResolvePathOptions, Schema } from '@kubb/swagger'
import type { OasTypes } from '@kubb/swagger/oas'
import type { fakerKeywordMapper } from './fakerParser'

export type Options = {
  output?: {
    /**
     * Relative path to save the Faker mocks.
     * When output is a file it will save all models inside that file else it will create a file per schema item.
     * @default 'mocks'
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
   * Group the Faker mocks based on the provided name.
   */
  group?: {
    /**
     * Tag will group based on the operation tag inside the Swagger file
     */
    type: 'tag'
    /**
     * Relative path to save the grouped Faker mocks.
     *
     * `{{tag}}` will be replaced by the current tagName.
     * @example `${output}/{{tag}}Controller` => `mocks/PetController`
     * @default `${output}/{{tag}}Controller`
     */
    output?: string
    /**
     * Name to be used for the `export * as {{exportAs}} from './`
     * @default `"{{tag}}Mocks"`
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
  override?: Array<Override<Options>>
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
  transformers?: {
    /**
     * Customize the names based on the type that is provided by the plugin.
     */
    name?: (name: ResolveNameParams['name'], type?: ResolveNameParams['type']) => string
    /**
     * Receive schema and baseName(propertName) and return FakerMeta array
     * TODO TODO add docs
     * @beta
     */
    schema?: (schema: OasTypes.SchemaObject | undefined, baseName?: string) => Schema[] | undefined
  }
  /**
   * Override FakerMapper with extra mappers(that can be overriden by `transformers.schema`)
   * TODO TODO add docs
   * @beta
   */
  mapper?: typeof fakerKeywordMapper
  /**
   * The use of Seed is intended to allow for consistent values in a test.
   */
  seed?: number | number[]
}

type ResolvedOptions = {
  dateType: NonNullable<Options['dateType']>
  unknownType: NonNullable<Options['unknownType']>
  mapper: NonNullable<Options['mapper']>
  transformers: NonNullable<Options['transformers']>
  seed: NonNullable<Options['seed']> | undefined
}

export type FileMeta = {
  pluginKey?: Plugin['key']
  tag?: string
}

export type PluginOptions = PluginFactoryOptions<'swagger-faker', Options, ResolvedOptions, never, ResolvePathOptions>

declare module '@kubb/core' {
  export interface _Register {
    ['@kubb/swagger-faker']: PluginOptions
  }
}
