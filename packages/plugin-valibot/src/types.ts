import type { Group, Output, PluginFactoryOptions, ResolveNameParams } from '@kubb/core'
import type { contentType, Oas, SchemaObject } from '@kubb/oas'
import type { Exclude, Include, Override, ResolvePathOptions, Schema } from '@kubb/plugin-oas'
import type { Generator } from '@kubb/plugin-oas/generators'

export type Options = {
  /**
   * @default 'valibot'
   */
  output?: Output<Oas>
  /**
   * Define which contentType should be used.
   * By default, the first JSON valid mediaType will be used
   */
  contentType?: contentType
  /**
   * Group the Valibot schemas based on the provided name.
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
   * Path to Valibot
   * It will be used as `import * as v from '${importPath}'`.
   * It allows both relative and absolute path.
   * the path will be applied as is, so relative path should be based on the file being generated.
   * @default 'valibot'
   */
  importPath?: string

  /**
   * Choose to use `date` or `datetime` as JavaScript `Date` instead of `string`.
   * False will fallback on a simple v.string() format
   * @default 'string'
   */
  dateType?: false | 'string' | 'date'
  /**
   * Which type to use when the Swagger/OpenAPI file is not providing more information
   * @default 'any'
   */
  unknownType?: 'any' | 'unknown'
  /**
   * Which type to use for empty schema values
   * @default `unknownType`
   */
  emptySchemaType?: 'any' | 'unknown'
  /**
   * Use TypeScript(`@kubb/plugin-ts`) to add type annotation.
   */
  typed?: boolean
  /**
   * Return Valibot generated schema as type with v.InferOutput<TYPE>
   */
  inferred?: boolean
  operations?: boolean
  mapper?: Record<string, string>
  transformers?: {
    /**
     * Customize the names based on the type that is provided by the plugin.
     */
    name?: (name: ResolveNameParams['name'], type?: ResolveNameParams['type']) => string
    /**
     * Receive schema and baseName(propertName) and return Schema array
     * @beta
     */
    schema?: (
      props: {
        schema?: SchemaObject
        name?: string
        parentName?: string
      },
      defaultSchemas: Schema[],
    ) => Schema[] | undefined
  }
  /**
   * Define some generators next to the valibot generators
   */
  generators?: Array<Generator<PluginValibot>>
}

type ResolvedOptions = {
  output: Output<Oas>
  group: Options['group']
  override: NonNullable<Options['override']>
  transformers: NonNullable<Options['transformers']>
  dateType: NonNullable<Options['dateType']>
  unknownType: NonNullable<Options['unknownType']>
  emptySchemaType: NonNullable<Options['emptySchemaType']>
  typed: NonNullable<Options['typed']>
  inferred: NonNullable<Options['inferred']>
  mapper: NonNullable<Options['mapper']>
  importPath: NonNullable<Options['importPath']>
  operations: NonNullable<Options['operations']>
}

export type PluginValibot = PluginFactoryOptions<'plugin-valibot', Options, ResolvedOptions, never, ResolvePathOptions>
