import type { Output, PluginFactoryOptions, ResolveNameParams } from '@kubb/core'
import type { SchemaObject } from '@kubb/oas'
import type { Exclude, Include, Override, ResolvePathOptions, Schema } from '@kubb/plugin-oas'

export type Options = {
  /**
   * @default 'zod'
   */
  output?: Output
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
  /**
   * Path to Zod
   * It will be used as `import { z } from '${importPath}'`.
   * It allows both relative and absolute path.
   * the path will be applied as is, so relative path should be based on the file being generated.
   * @default 'zod'
   */
  importPath?: string

  /**
   * Choose to use `date` or `datetime` as JavaScript `Date` instead of `string`.
   * False will fallback on a simple z.string() format
   * @default 'string' 'stringOffset' will become the default in Kubb v3
   */
  dateType?: false | 'string' | 'stringOffset' | 'stringLocal' | 'date'
  /**
   * Which type to use when the Swagger/OpenAPI file is not providing more information
   * @default 'any'
   */
  unknownType?: 'any' | 'unknown'
  /**
   * Use TypeScript(`@kubb/plugin-ts`) to add type annotation.
   */
  typed?: boolean
  /**
   * Return Zod generated schema as type with z.infer<TYPE>
   */
  inferred?: boolean
  /**
   * Use of z.coerce.string() instead of z.string()
   */
  coercion?: boolean
  operations?: boolean
  mapper?: Record<string, string>
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
    schema?: (
      props: {
        schema?: SchemaObject
        name?: string
        parentName?: string
      },
      defaultSchemas: Schema[],
    ) => Schema[] | undefined
  }
}

type ResolvedOptions = {
  override: NonNullable<Options['override']>

  transformers: NonNullable<Options['transformers']>
  dateType: NonNullable<Options['dateType']>
  unknownType: NonNullable<Options['unknownType']>
  typed: NonNullable<Options['typed']>
  inferred: NonNullable<Options['inferred']>
  mapper: NonNullable<Options['mapper']>
  importPath: NonNullable<Options['importPath']>
  coercion: NonNullable<Options['coercion']>
  operations: NonNullable<Options['coercion']>
}

export type PluginZod = PluginFactoryOptions<'plugin-zod', Options, ResolvedOptions, never, ResolvePathOptions>
