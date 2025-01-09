import type { Group, Output, PluginFactoryOptions, ResolveNameParams } from '@kubb/core'

import type { Oas, SchemaObject } from '@kubb/oas'
import type { Exclude, Generator, Include, Override, ResolvePathOptions, Schema } from '@kubb/plugin-oas'

export type Options = {
  /**
   * Specify the export location for the files and define the behavior of the output
   * @default { path: 'handlers', barrelType: 'named' }
   */
  output?: Output<Oas>
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
   * Choose to use `date` or `datetime` as JavaScript `Date` instead of `string`.
   * @default 'string'
   */
  dateType?: 'string' | 'date'
  /**
   * Which parser should be used when dateType is set to 'string'.
   * - Schema with format 'date' will use ISO date format (YYYY-MM-DD)
   *   - `'dayjs'` will use `dayjs(faker.date.anytime()).format("YYYY-MM-DD")`.
   *   - `undefined` will use `faker.date.anytime().toString()`
   * - Schema with format 'time' will use ISO time format (HH:mm:ss[.SSSSSS])
   *   - `'dayjs'` will use `dayjs(faker.date.anytime()).format("HH:mm:ss")`.
   *   - `undefined` will use `faker.date.anytime().toString()`
   * * @default 'faker'
   */
  dateParser?: 'faker' | 'dayjs' | 'moment' | (string & {})
  /**
   * Which type to use when the Swagger/OpenAPI file is not providing more information
   * @default 'any'
   */
  unknownType?: 'any' | 'unknown'
  /**
   * Choose which generator to use when using Regexp.
   *
   * `'faker'` will use `faker.helpers.fromRegExp(new RegExp(/test/))`
   * `'randexp'` will use `new RandExp(/test/).gen()`
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
     * Receive schema and baseName(propertName) and return FakerMeta array
     * TODO TODO add docs
     * @beta
     */
    schema?: (props: { schema?: SchemaObject; name?: string; parentName?: string }, defaultSchemas: Schema[]) => Schema[] | undefined
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
  transformers: NonNullable<Options['transformers']>
  seed: NonNullable<Options['seed']> | undefined
  mapper: NonNullable<Options['mapper']>
  regexGenerator: NonNullable<Options['regexGenerator']>
}
export type PluginFaker = PluginFactoryOptions<'plugin-faker', Options, ResolvedOptions, never, ResolvePathOptions>
