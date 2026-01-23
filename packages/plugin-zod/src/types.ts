import type { Group, Output, PluginFactoryOptions, ResolveNameParams } from '@kubb/core'
import type { contentType, Oas, SchemaObject } from '@kubb/oas'
import type { Exclude, Include, Override, ResolvePathOptions, Schema } from '@kubb/plugin-oas'
import type { Generator } from '@kubb/plugin-oas/generators'

export type Options = {
  /**
   * @default 'zod'
   */
  output?: Output<Oas>
  /**
   * Define which contentType should be used.
   * By default, the first JSON valid mediaType is used
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
   * It used as `import { z } from '${importPath}'`.
   * Accepts relative and absolute paths.
   * Path is used as-is; relative paths are based on the generated file location.
   * @default 'zod'
   */
  importPath?: string

  /**
   * Choose to use date or datetime as JavaScript Date instead of string.
   * - false falls back to a simple z.string() format.
   * - 'string' uses z.string().datetime() for datetime validation.
   * - 'stringOffset' uses z.string().datetime({ offset: true }) for datetime with timezone offset validation.
   * - 'stringLocal' uses z.string().datetime({ local: true }) for local datetime validation.
   * - 'date' uses z.date() for JavaScript Date objects.
   * @default 'string'
   * @note 'stringOffset' will become the default in Kubb v3.
   */
  dateType?: false | 'string' | 'stringOffset' | 'stringLocal' | 'date'
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
     * Receive schema and baseName(propertyName) and return FakerMeta array
     * TODO TODO add docs
     * @beta
     */
    schema?: (
      props: {
        schema: SchemaObject | null
        name: string | null
        parentName: string | null
      },
      defaultSchemas: Schema[],
    ) => Schema[] | undefined
  }
  /**
   * Which version of Zod should be used.
   * - '3' uses Zod v3.x syntax and features.
   * - '4' uses Zod v4.x syntax and features.
   * @default '3'
   */
  version?: '3' | '4'
  /**
   * Use Zod Mini's functional API for better tree-shaking support.
   * When enabled, generates functional syntax (e.g., `z.optional(z.string())`) instead of chainable methods (e.g., `z.string().optional()`).
   * Requires Zod v4 or later. When `mini: true`, `version` is set to '4' and `importPath` will default to 'zod/mini'.
   * @default false
   */
  mini?: boolean
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
  emptySchemaType: NonNullable<Options['emptySchemaType']>
  typed: NonNullable<Options['typed']>
  inferred: NonNullable<Options['inferred']>
  mapper: NonNullable<Options['mapper']>
  importPath: NonNullable<Options['importPath']>
  coercion: NonNullable<Options['coercion']>
  operations: NonNullable<Options['operations']>
  wrapOutput: Options['wrapOutput']
  version: NonNullable<Options['version']>
  mini: NonNullable<Options['mini']>
}

export type PluginZod = PluginFactoryOptions<'plugin-zod', Options, ResolvedOptions, never, ResolvePathOptions>
