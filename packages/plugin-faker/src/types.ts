import type { Group, Output, PluginFactoryOptions, ResolveNameParams } from '@kubb/core'

import type { contentType, Oas, SchemaObject } from '@kubb/oas'
import type { Exclude, Include, Override, ResolvePathOptions, Schema } from '@kubb/plugin-oas'
import type { Generator } from '@kubb/plugin-oas/generators'

export type Options = {
  /**
   * Specify the export location for the files and define the behavior of the output
   * @default { path: 'handlers', barrelType: 'named' }
   */
  output?: Output<Oas>
  /**
   * Define which contentType should be used.
   * By default, the first JSON valid mediaType is used
   */
  contentType?: contentType
  /**
   * Group the Faker mocks based on the provided name.
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
   * Choose to use date or datetime as JavaScript Date instead of string.
   * - 'string' represents dates as string values.
   * - 'date' represents dates as JavaScript Date objects.
   * @default 'string'
   */
  dateType?: 'string' | 'date'
  /**
   * Which parser should be used when dateType is set to string.
   * - 'faker' uses faker's built-in date formatting methods.
   * - 'dayjs' uses dayjs for date formatting with custom patterns.
   * - 'moment' uses moment for date formatting with custom patterns.
   * @default 'faker'
   */
  dateParser?: 'faker' | 'dayjs' | 'moment' | (string & {})
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
   * Choose which generator to use when using Regexp.
   * - 'faker' uses faker.helpers.fromRegExp for generating values from regex patterns.
   * - 'randexp' uses RandExp library for generating values from regex patterns.
   * @default 'faker'
   */
  regexGenerator?: 'faker' | 'randexp'

  mapper?: Record<string, string>
  /**
   * The use of Seed is intended to allow for consistent values in a test.
   */
  seed?: number | number[]
  transformers?: {
    /**
     * Customize the names based on the type that is provided by the plugin.
     */
    name?: (name: ResolveNameParams['name'], type?: ResolveNameParams['type']) => string
    /**
     * Receive schema and baseName(propertyName) and return FakerMeta array
     * TODO TODO add docs
     * @beta
     */
    schema?: (props: { schema: SchemaObject | null; name: string | null; parentName: string | null }, defaultSchemas: Schema[]) => Schema[] | undefined
  }
  /**
   * Define some generators next to the faker generators
   */
  generators?: Array<Generator<PluginFaker>>
}

type ResolvedOptions = {
  output: Output<Oas>
  group: Options['group']
  override: NonNullable<Options['override']>
  dateType: NonNullable<Options['dateType']>
  dateParser: NonNullable<Options['dateParser']>
  unknownType: NonNullable<Options['unknownType']>
  emptySchemaType: NonNullable<Options['emptySchemaType']>
  transformers: NonNullable<Options['transformers']>
  seed: NonNullable<Options['seed']> | undefined
  mapper: NonNullable<Options['mapper']>
  regexGenerator: NonNullable<Options['regexGenerator']>
}
export type PluginFaker = PluginFactoryOptions<'plugin-faker', Options, ResolvedOptions, never, ResolvePathOptions>
