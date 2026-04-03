import type { OperationParamsResolver } from '@kubb/ast'
import type { OperationNode, ParameterNode, SchemaNode, StatusCode, Visitor } from '@kubb/ast/types'
import type {
  CompatibilityPreset,
  Exclude,
  Generator,
  Group,
  Include,
  Output,
  Override,
  PluginFactoryOptions,
  ResolvePathOptions,
  Resolver,
  UserGroup,
} from '@kubb/core'
import type { PrinterZodNodes } from './printers/printerZod.ts'
import type { PrinterZodMiniNodes } from './printers/printerZodMini.ts'

/**
 * The concrete resolver type for `@kubb/plugin-zod`.
 * Extends the base `Resolver` with zod-specific naming helpers.
 */
export type ResolverZod = Resolver &
  OperationParamsResolver & {
    /**
     * Resolves a camelCase schema function name with a `Schema` suffix.
     */
    resolveSchemaName(this: ResolverZod, name: string): string
    /**
     * Resolves the name for a `z.infer<typeof ...>` type export.
     * Strips the trailing `Schema` suffix (added by `resolveSchemaName`) before PascalCasing.
     *
     * @example
     * resolver.resolveSchemaTypeName('pet) // → 'PetSchema'
     * resolver.resolveSchemaTypeName('addPet200') // → 'AddPet200Schema'
     * resolver.resolveSchemaTypeName('PetName') // → 'PetNameSchema'
     */
    resolveSchemaTypeName(this: ResolverZod, name: string): string
    /**
     * Resolves the name for a `z.infer<typeof ...>` type export.
     * Strips the trailing `Schema` suffix (added by `resolveSchemaName`) before PascalCasing.
     *
     * @example
     * resolver.resolveTypeName('pet') // → 'Pet'
     * resolver.resolveTypeName('addPet200') // → 'AddPet200'
     * resolver.resolveTypeName('PetName') // → 'PetName'
     */
    resolveTypeName(this: ResolverZod, name: string): string
    /**
     * Resolves a PascalCase path/file name for the generated output.
     */
    resolvePathName(this: ResolverZod, name: string, type?: 'file' | 'function' | 'type' | 'const'): string
    /**
     * Resolves the name for an operation response by status code.
     *
     * @example
     * resolver.resolveResponseStatusName(node, 200) // → 'listPetsStatus200Schema'
     */
    resolveResponseStatusName(this: ResolverZod, node: OperationNode, statusCode: StatusCode): string
    /**
     * Resolves the name for the collection of all operation responses.
     *
     * @example
     * resolver.resolveResponsesName(node) // → 'listPetsResponsesSchema'
     */
    resolveResponsesName(this: ResolverZod, node: OperationNode): string
    /**
     * Resolves the name for the union of all operation responses.
     *
     * @example
     * resolver.resolveResponseName(node) // → 'listPetsResponseSchema'
     */
    resolveResponseName(this: ResolverZod, node: OperationNode): string
    /**
     * Resolves the name for an operation's grouped path parameters type.
     *
     * @example
     * resolver.resolvePathParamsName(node, param) // → 'deletePetPathPetIdSchema'
     */
    resolvePathParamsName(this: ResolverZod, node: OperationNode, param: ParameterNode): string
    /**
     * Resolves the name for an operation's grouped query parameters type.
     *
     * @example
     * resolver.resolveQueryParamsName(node, param) // → 'findPetsByStatusQueryStatusSchema'
     */
    resolveQueryParamsName(this: ResolverZod, node: OperationNode, param: ParameterNode): string
    /**
     * Resolves the name for an operation's grouped header parameters type.
     *
     * @example
     * resolver.resolveHeaderParamsName(node, param) // → 'deletePetHeaderApiKeySchema'
     */
    resolveHeaderParamsName(this: ResolverZod, node: OperationNode, param: ParameterNode): string
  }

export type Options = {
  /**
   * @default 'zod'
   */
  output?: Output
  /**
   * Group the Zod schemas based on the provided name.
   */
  group?: UserGroup
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
  importPath?: 'zod' | 'zod/mini' | (string & {})
  /**
   * Choose to use date or datetime as JavaScript Date instead of string.
   * - false falls back to a simple z.string() format.
   * - 'string' uses z.string().datetime() for datetime validation.
   * - 'stringOffset' uses z.string().datetime({ offset: true }) for datetime with timezone offset validation.
   * - 'stringLocal' uses z.string().datetime({ local: true }) for local datetime validation.
   * - 'date' uses z.date() for JavaScript Date objects.
   * @default 'string'
   */
  dateType?: false | 'string' | 'stringOffset' | 'stringLocal' | 'date'
  /**
   * Use TypeScript(`@kubb/plugin-ts`) to add type annotation.
   */
  typed?: boolean
  /**
   * Return Zod generated schema as type with z.infer<TYPE>
   */
  inferred?: boolean
  /**
   * Use of z.coerce.string() instead of z.string().
   * Can also be an object to enable coercion for dates, strings, and numbers.
   */
  coercion?: boolean | { dates?: boolean; strings?: boolean; numbers?: boolean }
  /**
   * Generate operation-level schemas (grouped by operationId).
   */
  operations?: boolean
  /**
   * Which Zod GUID validator to use for OpenAPI `format: uuid`.
   * - 'uuid' uses UUID validation.
   * - 'guid' uses GUID validation.
   * @default 'uuid'
   */
  guidType?: 'uuid' | 'guid'
  /**
   * Use Zod Mini's functional API for better tree-shaking support.
   * When enabled, generates functional syntax (e.g., `z.optional(z.string())`)
   * instead of chainable methods (e.g., `z.string().optional()`).
   * When `mini: true`, `importPath` will default to 'zod/mini'.
   * @default false
   */
  mini?: boolean
  /**
   * Callback function to wrap the output of the generated zod schema.
   *
   * Useful for edge cases like adding `.openapi()` metadata or wrapping
   * schemas with extension helpers (openapi -> zod -> openapi round-trips).
   */
  wrapOutput?: (arg: { output: string; schema: SchemaNode }) => string | undefined
  /**
   * How to style your params, by default no casing is applied
   * - 'camelcase' uses camelCase for pathParams, queryParams and headerParams property names
   * @default undefined
   */
  paramsCasing?: 'camelcase'
  /**
   * Define additional generators next to the zod generators.
   */
  generators?: Array<Generator<PluginZod>>
  /**
   * Compatibility preset to ease migration from previous Kubb versions.
   */
  compatibilityPreset?: CompatibilityPreset
  /**
   * A single resolver whose methods override the default resolver's naming conventions.
   * When a method returns `null` or `undefined`, the default resolver's result is used instead.
   */
  resolver?: Partial<ResolverZod> & ThisType<ResolverZod>
  /**
   * Override individual printer node handlers to customise rendering of specific schema types.
   *
   * Each key is a `SchemaType` (e.g. `'date'`, `'string'`). The function replaces the
   * built-in handler for that type. Use `this.transform` to recurse into nested schema nodes.
   * When `mini: true`, the overrides apply to the Zod Mini printer.
   *
   * @example Override the `date` node to use `z.string().date()`
   * ```ts
   * pluginZod({
   *   printer: {
   *     nodes: {
   *       date(node) {
   *         return 'z.string().date()'
   *       },
   *     },
   *   },
   * })
   * ```
   */
  printer?: {
    nodes?: PrinterZodNodes | PrinterZodMiniNodes
  }
  /**
   * A single AST visitor applied to each SchemaNode/OperationNode before printing.
   * When a visitor method returns `null` or `undefined`, the preset transformer's result is used instead.
   */
  transformer?: Visitor
}

type ResolvedOptions = {
  output: Output
  group: Group | undefined
  dateType: NonNullable<Options['dateType']>
  typed: NonNullable<Options['typed']>
  inferred: NonNullable<Options['inferred']>
  importPath: NonNullable<Options['importPath']>
  coercion: NonNullable<Options['coercion']>
  operations: NonNullable<Options['operations']>
  guidType: NonNullable<Options['guidType']>
  mini: NonNullable<Options['mini']>
  wrapOutput: Options['wrapOutput']
  paramsCasing: Options['paramsCasing']
  printer: Options['printer']
}

export type PluginZod = PluginFactoryOptions<'plugin-zod', Options, ResolvedOptions, never, ResolvePathOptions, ResolverZod>

declare global {
  namespace Kubb {
    interface PluginRegistry {
      'plugin-zod': PluginZod
    }
  }
}
