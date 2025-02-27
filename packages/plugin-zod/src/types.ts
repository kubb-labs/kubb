import type { Group, Output, PluginFactoryOptions, ResolveNameParams } from '@kubb/core'
import type { Oas, SchemaObject, contentType } from '@kubb/oas'
import type { Exclude, Generator, Include, Override, ResolvePathOptions, Schema } from '@kubb/plugin-oas'

export type Options = {
  /**
   * @default 'zod'
   */
  output?: Output<Oas>
  /**
   * Define which contentType should be used.
   * By default, the first JSON valid mediaType will be used
   */
  contentType?: contentType
  /**
   * Group the Zod schemas based on the provided name.
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
   * can also be an object to enable coercion for dates, strings, and numbers
   */
  coercion?:
    | boolean
    | {
        dates?: boolean
        strings?: boolean
        numbers?: boolean
      }
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
  /**
   * Callback function to wrap the output of the generated zod schema
   *
   * This is useful for edge case scenarios where you might leverage something like `z.object({ ... }).openapi({ example: { some: "complex-example" }})`
   * or `extendApi(z.object({ ... }), { example: { some: "complex-example", ...otherOpenApiProperties }})`
   * while going from openapi -> zod -> openapi
   */
  wrapOutput?: (arg: { output: string; schema: SchemaObject }) => string | undefined
  /**
   * Define some generators next to the zod generators
   */
  generators?: Array<Generator<PluginZod>>
}

type ResolvedOptions = {
  output: Output<Oas>
  group: Options['group']
  override: NonNullable<Options['override']>
  transformers: NonNullable<Options['transformers']>
  dateType: NonNullable<Options['dateType']>
  unknownType: NonNullable<Options['unknownType']>
  typed: NonNullable<Options['typed']>
  inferred: NonNullable<Options['inferred']>
  mapper: NonNullable<Options['mapper']>
  importPath: NonNullable<Options['importPath']>
  coercion: NonNullable<Options['coercion']>
  operations: NonNullable<Options['operations']>
  wrapOutput: Options['wrapOutput']
}

export type PluginZod = PluginFactoryOptions<'plugin-zod', Options, ResolvedOptions, never, ResolvePathOptions>
