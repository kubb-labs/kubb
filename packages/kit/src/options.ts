import path from 'node:path'
import type { LiteralUnion } from '@internals/utils'
import type { HttpMethod, Macro } from '@kubb/ast'
import type { BannerMeta, Resolver, ResolverPatch } from '@kubb/core'
import * as z from 'zod'

/**
 * A value an option is compared against in a `when` condition.
 */
export type WhenValue = string | number | boolean | null

/**
 * Shows an option only when every entry matches. Keys are dotted option paths, such as `'enum.type'`.
 */
export type WhenCondition = Record<string, WhenValue | ReadonlyArray<WhenValue>>

declare module 'zod' {
  interface GlobalMeta {
    'x-kubb-when'?: WhenCondition
    'x-kubb-values'?: ReadonlyArray<string>
  }
}

/**
 * Builds `x-kubb-when` metadata for `.meta()`, such as `.meta({ description, ...when({ 'enum.type': 'asConst' }) })`.
 */
export function when(condition: WhenCondition): { 'x-kubb-when': WhenCondition } {
  return { 'x-kubb-when': condition }
}

/**
 * Accepts any string while its type autocompletes `values`. JSON Schema lists them as `x-kubb-values`.
 */
export function suggest<const TValues extends ReadonlyArray<string>>(values: TValues): z.ZodType<LiteralUnion<TValues[number]>, LiteralUnion<TValues[number]>> {
  return z.string().meta({ 'x-kubb-values': values })
}

// `z.function()` would wrap user callbacks, so accept any function as written.
function functionSchema<T>() {
  return z.custom<T>((value) => typeof value === 'function', { message: 'Expected a function' })
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isMacro(value: unknown): boolean {
  if (!isObject(value) || typeof value.name !== 'string') return false
  return Object.entries(value).every(([key, member]) => key === 'name' || key === 'enforce' || member === undefined || typeof member === 'function')
}

const bannerSchema = z.union([z.string(), functionSchema<(meta: BannerMeta) => string>()])

/**
 * Mirrors core's `Output`, including `barrel`. The `group` check lives in {@link outputOptionsSchema}.
 * @see https://kubb.dev/docs/5.x/reference/plugin-options#output
 */
export const outputSchema = z
  .object({
    path: z.string().meta({
      description:
        "Directory where the plugin writes its generated code, resolved against the global `output.path` set on `defineConfig`. With `mode: 'file'`, this is the full output file path and must include the extension (e.g. `'types.ts'`, `'models.py'`).",
    }),
    mode: z
      .enum(['directory', 'file'])
      .meta({
        description:
          "How generated code is consolidated into files. `'file'` writes everything into a single file, `'directory'` writes one file per operation or schema under `path`. Defaults to `'file'` when `path` carries an extension and `'directory'` when it does not.",
      })
      .optional(),
    banner: bannerSchema
      .meta({
        description:
          "Text prepended to every generated file. Useful for license headers, lint disables, or `@ts-nocheck` directives. Pass a function to compute the banner from the file's `BannerMeta`.",
      })
      .optional(),
    footer: bannerSchema
      .meta({ description: "Text appended at the end of every generated file. Pass a function to compute the footer from the file's `BannerMeta`." })
      .optional(),
    barrel: z
      .union([
        z.object({
          type: z.enum(['all', 'named']).meta({
            description: "Export strategy for the plugin's barrel files. `'all'` uses wildcard exports, `'named'` uses explicit exports.",
          }),
          nested: z
            .boolean()
            .meta({ description: "Generate an `index.ts` in every sub-directory, each re-exporting only what's directly inside it." })
            .optional(),
        }),
        z.literal(false),
      ])
      .meta({
        description:
          "Barrel configuration for this plugin's output. Set to `{ type: 'named' | 'all' }` to opt into a barrel, or `false` to disable it. Falls back to `config.output.barrel` when omitted.",
      })
      .optional(),
  })
  .meta({ description: 'Output configuration shared by every plugin.' })

/**
 * Mirrors core's `Group`.
 * @see https://kubb.dev/docs/5.x/reference/plugin-options#group
 */
export const groupSchema = z
  .object({
    type: z.enum(['tag', 'path']).meta({
      description: "Property used to assign each operation to a group. `'tag'` uses the first tag, `'path'` uses the first segment of the operation's URL.",
    }),
    name: functionSchema<(context: { group: string }) => string>()
      .meta({
        description:
          'Returns the subdirectory name from the group key. Defaults to the camelCased tag for `tag` groups, or the first path segment as written in the spec for `path` groups.',
      })
      .optional(),
  })
  .meta({ description: 'Groups generated files into subdirectories based on an OpenAPI tag or path segment.' })

type GroupedOptions = { output?: { path: string; mode?: 'directory' | 'file' }; group?: object }

function refineGroup(options: GroupedOptions, ctx: z.RefinementCtx): void {
  if (!options.output || !options.group) return

  const mode = options.output.mode ?? (path.extname(options.output.path) ? 'file' : 'directory')
  if (mode === 'file') {
    ctx.addIssue({
      code: 'custom',
      path: ['group'],
      message:
        "A single-file output has nothing to group. Remove the `group` option, give `output.path` an extensionless directory name, or set `output.mode: 'directory'` explicitly.",
    })
  }
}

/**
 * `output` and `group` together. Rejects `group` when `output.mode` resolves to `'file'`. `.extend()` keeps the check.
 * @see https://kubb.dev/docs/5.x/reference/plugin-options#output
 */
export const outputOptionsSchema = z
  .object({
    output: outputSchema.optional(),
    group: groupSchema.optional(),
  })
  .superRefine(refineGroup)

const patternSchema = z.union([z.string(), z.instanceof(RegExp)])

function byPattern<const TType extends string>(type: TType, typeDescription: string, patternDescription: string) {
  return z.object({
    type: z.literal(type).meta({ description: typeDescription }),
    pattern: patternSchema.meta({ description: patternDescription }),
  })
}

const httpMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS', 'TRACE'] as const satisfies ReadonlyArray<HttpMethod>

/**
 * Mirrors core's `Filter`: one include, exclude, or override rule.
 * @see https://kubb.dev/docs/5.x/reference/plugin-options#include
 */
export const filterSchema = z
  .discriminatedUnion('type', [
    byPattern(
      'tag',
      'Filter by OpenAPI `tags` field. Matches one or more tags assigned to operations.',
      'Tag name to match (case-sensitive). Can be a literal string or regex pattern.',
    ),
    byPattern(
      'operationId',
      'Filter by OpenAPI `operationId` field. Each operation (GET, POST, etc.) has a unique identifier.',
      'Operation ID to match (case-sensitive). Can be a literal string or regex pattern.',
    ),
    byPattern(
      'path',
      'Filter by OpenAPI `path` (URL endpoint). Useful to group or filter by service segments like `/pets`, `/users`, etc.',
      'URL path to match (case-sensitive). Can be a literal string or regex pattern. Matches against the full path.',
    ),
    z.object({
      type: z.literal('method').meta({ description: 'Filter by HTTP method.' }),
      pattern: z
        .union([z.enum(httpMethods), z.instanceof(RegExp)])
        .meta({ description: 'HTTP method to match, as one of the `HttpMethod` values or a regex.' }),
    }),
    byPattern(
      'contentType',
      "Filter by response or request content type: `'application/json'`, `'application/xml'`, etc.",
      'Content type to match (case-sensitive). Can be a literal string or regex pattern.',
    ),
    byPattern(
      'schemaName',
      'Filter by schema component name (TypeScript or JSON schema). Matches schemas in `#/components/schemas`.',
      'Schema name to match (case-sensitive). Can be a literal string or regex pattern.',
    ),
  ])
  .meta({ description: 'Pattern filter that matches operations or schemas by tag, operationId, path, method, content type, or schema name.' })

/**
 * @see https://kubb.dev/docs/5.x/reference/plugin-options#include
 */
export const includeSchema = z.array(filterSchema).meta({ description: 'Restricts generation to operations or schemas matching at least one entry.' })

/**
 * @see https://kubb.dev/docs/5.x/reference/plugin-options#exclude
 */
export const excludeSchema = z.array(filterSchema).meta({ description: 'Skips matching operations or schemas during generation.' })

/**
 * Builds the `override` option from a plugin's options schema, with partial `options` and no `override` key.
 * @see https://kubb.dev/docs/5.x/reference/plugin-options#override
 */
export function overrideSchema<TShape extends z.ZodRawShape>(options: z.ZodObject<TShape, z.core.$ZodObjectConfig>) {
  const { override: _override, ...shape } = options.shape

  return z
    .array(
      z.intersection(
        filterSchema,
        z.object({
          options: z
            .object(shape)
            .partial()
            .superRefine((options, ctx) => refineGroup(options as GroupedOptions, ctx))
            .meta({ description: 'Options merged on top of the plugin options when the filter matches.' }),
        }),
      ),
    )
    .meta({ description: 'Filters paired with partial options. The first matching entry wins.' })
}

/**
 * Mirrors core's `ResolverPatch<T>`.
 * @see https://kubb.dev/docs/5.x/reference/plugin-options#resolver
 */
export function resolverSchema<T extends Resolver = Resolver>() {
  return z
    .custom<ResolverPatch<T>>(
      (value) => isObject(value) && Object.values(value).every((member) => member === undefined || typeof member === 'function' || isObject(member)),
      { message: 'Expected a resolver object of methods and method namespaces' },
    )
    .meta({ description: "Partial resolver whose methods replace the plugin's naming and path defaults." })
}

/**
 * @see https://kubb.dev/docs/5.x/reference/plugin-options#macros
 */
export const macrosSchema = z
  .array(z.custom<Macro>(isMacro, { message: 'Expected a macro object with a name and function hooks' }))
  .meta({ description: 'Named AST transforms that run before the generators.' })
