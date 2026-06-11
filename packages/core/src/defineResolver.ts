import path from 'node:path'
import { camelCase, pascalCase } from '@internals/utils'
import type { FileNode, InputMeta, Node, OperationNode, SchemaNode } from '@kubb/ast'
import { createFile, isOperationNode, isSchemaNode } from '@kubb/ast'
import { Diagnostics } from './diagnostics.ts'
import type { PluginFactoryOptions } from './definePlugin.ts'
import type { Config, Group, Output } from './types.ts'

/**
 * Type/string pattern filter for include/exclude/override matching.
 */
type PatternFilter = {
  type: string
  pattern: string | RegExp
}

/**
 * Pattern filter with partial option overrides applied when the pattern matches.
 */
type PatternOverride<TOptions> = PatternFilter & {
  options: Omit<Partial<TOptions>, 'override'>
}

/**
 * Context for resolving filtered options for a given operation or schema node.
 *
 * @internal
 */
export type ResolveOptionsContext<TOptions> = {
  options: TOptions
  exclude?: Array<PatternFilter>
  include?: Array<PatternFilter>
  override?: Array<PatternOverride<TOptions>>
}

/**
 * Base constraint for all plugin resolver objects.
 *
 * `default`, `resolveOptions`, `resolvePath`, `resolveFile`, `resolveBanner`, and `resolveFooter`
 * are injected automatically by `defineResolver`. Extend this type to add custom resolution methods.
 *
 * @example
 * ```ts
 * type MyResolver = Resolver & {
 *   resolveName(node: SchemaNode): string
 *   resolveTypedName(node: SchemaNode): string
 * }
 * ```
 */
export type Resolver = {
  name: string
  pluginName: string
  default(name: string, type?: 'file' | 'function' | 'type' | 'const'): string
  resolveOptions<TOptions>(node: Node, context: ResolveOptionsContext<TOptions>): TOptions | null
  resolvePath(params: ResolverPathParams, context: ResolverContext): string
  resolveFile(params: ResolverFileParams, context: ResolverContext): FileNode
  resolveBanner(meta: InputMeta | undefined, context: ResolveBannerContext): string | null
  resolveFooter(meta: InputMeta | undefined, context: ResolveBannerContext): string | null
}

/**
 * File-specific parameters for `Resolver.resolvePath`.
 *
 * Pass alongside a `ResolverContext` to identify which file to resolve.
 * Provide `tag` for tag-based grouping or `path` for path-based grouping.
 *
 * @example
 * ```ts
 * resolver.resolvePath(
 *   { baseName: 'petTypes.ts', tag: 'pets' },
 *   { root: '/src', output: { path: 'types' }, group: { type: 'tag' } },
 * )
 * // → '/src/types/pets/petTypes.ts'
 * ```
 */
export type ResolverPathParams = {
  baseName: FileNode['baseName']
  /**
   * Tag value used when `group.type === 'tag'`.
   */
  tag?: string
  /**
   * Path value used when `group.type === 'path'`.
   */
  path?: string
}

/**
 * Shared context passed as the second argument to `Resolver.resolvePath` and `Resolver.resolveFile`.
 *
 * Describes where on disk output is rooted, which output config is active, and the optional
 * grouping strategy that controls subdirectory layout.
 *
 * @example
 * ```ts
 * const context: ResolverContext = {
 *   root: config.root,
 *   output,
 *   group,
 * }
 * ```
 */
export type ResolverContext = {
  root: string
  output: Output
  group?: Group
  /**
   * Plugin name used to populate `meta.pluginName` on the resolved file.
   */
  pluginName?: string
}

/**
 * File-specific parameters for `Resolver.resolveFile`.
 *
 * Pass alongside a `ResolverContext` to fully describe the file to resolve.
 * `tag` and `path` are used only when a matching `group` is present in the context.
 *
 * @example
 * ```ts
 * resolver.resolveFile(
 *   { name: 'listPets', extname: '.ts', tag: 'pets' },
 *   { root: '/src', output: { path: 'types' }, group: { type: 'tag' } },
 * )
 * // → { baseName: 'listPets.ts', path: '/src/types/pets/listPets.ts', ... }
 * ```
 */
export type ResolverFileParams = {
  name: string
  extname: FileNode['extname']
  /**
   * Tag value used when `group.type === 'tag'`.
   */
  tag?: string
  /**
   * Path value used when `group.type === 'path'`.
   */
  path?: string
}

/**
 * Per-file context describing the file a banner/footer is being resolved for.
 *
 * Supplied by the generator (or the barrel plugin) at resolve-time and merged
 * into `BannerMeta` so a `banner`/`footer` function can branch on the file kind,
 * e.g. omit a `'use server'` directive on re-export files.
 */
export type ResolveBannerFile = {
  /**
   * Full output path of the file being generated.
   */
  path: string
  /**
   * File name only, e.g. `'stocks.ts'`.
   */
  baseName: string
  /**
   * `true` for `index.ts` re-export barrels.
   */
  isBarrel?: boolean
  /**
   * `true` for group `[dir]/[dir].ts` aggregation files.
   */
  isAggregation?: boolean
}

/**
 * Document metadata extended with per-file context, passed to a `banner`/`footer` function.
 *
 * Carries everything in {@link InputMeta} plus the file the banner is rendered into, so a
 * single function can decide per file (e.g. skip a directive on barrel/aggregation files).
 *
 * @example Skip a directive on re-export files
 * `banner: (meta) => (meta.isBarrel || meta.isAggregation) ? '' : "'use server'"`
 */
export type BannerMeta = InputMeta & {
  /**
   * Full output path of the file being generated.
   */
  filePath: string
  /**
   * File name only, e.g. `'stocks.ts'`.
   */
  baseName: string
  /**
   * `true` for `index.ts` re-export barrels.
   */
  isBarrel: boolean
  /**
   * `true` for group `[dir]/[dir].ts` aggregation files.
   */
  isAggregation: boolean
}

/**
 * Context passed to `Resolver.resolveBanner` and `Resolver.resolveFooter`.
 *
 * `output` is optional, since not every plugin configures a banner/footer.
 * `config` carries the global Kubb config, used to derive the default Kubb banner.
 * `file` carries per-file context forwarded to a `banner`/`footer` function.
 *
 * @example
 * ```ts
 * resolver.resolveBanner(meta, { output: { banner: '// generated' }, config })
 * // → '// generated'
 * ```
 */
export type ResolveBannerContext = {
  output?: Pick<Output, 'banner' | 'footer'>
  config: Config
  file?: ResolveBannerFile
}

/**
 * Merges document `meta` with per-file `file` context into the `BannerMeta` passed to a
 * `banner`/`footer` function. Missing fields default to empty/`false` so the object shape
 * is stable even when a caller (e.g. the barrel plugin) has no document metadata.
 */
function buildBannerMeta({ meta, file }: { meta: InputMeta | undefined; file: ResolveBannerFile | undefined }): BannerMeta {
  return {
    title: meta?.title,
    description: meta?.description,
    version: meta?.version,
    baseURL: meta?.baseURL,
    circularNames: meta?.circularNames ?? [],
    enumNames: meta?.enumNames ?? [],
    filePath: file?.path ?? '',
    baseName: file?.baseName ?? '',
    isBarrel: file?.isBarrel ?? false,
    isAggregation: file?.isAggregation ?? false,
  }
}

/**
 * Builder type for the plugin-specific resolver fields.
 *
 * `default`, `resolveOptions`, `resolvePath`, `resolveFile`, `resolveBanner`, and `resolveFooter`
 * are optional, with built-in fallbacks injected when omitted.
 *
 * Methods in the returned object can call sibling resolver methods via `this`.
 */
type ResolverBuilder<T extends PluginFactoryOptions> = () => Omit<
  T['resolver'],
  'default' | 'resolveOptions' | 'resolvePath' | 'resolveFile' | 'resolveBanner' | 'resolveFooter' | 'name' | 'pluginName'
> &
  Partial<Pick<T['resolver'], 'default' | 'resolveOptions' | 'resolvePath' | 'resolveFile' | 'resolveBanner' | 'resolveFooter'>> & {
    name: string
    pluginName: T['name']
  } & ThisType<T['resolver']>

// String patterns are compiled lazily and cached, so the same filter is reused for every node.
const stringPatternCache = new Map<string, RegExp>()

function testPattern(value: string, pattern: string | RegExp): boolean {
  if (typeof pattern === 'string') {
    let regex = stringPatternCache.get(pattern)
    if (!regex) {
      regex = new RegExp(pattern)
      stringPatternCache.set(pattern, regex)
    }
    return regex.test(value)
  }
  // Use .match() for user-supplied RegExp to preserve semantics regardless of `g`/`y` flags.
  return value.match(pattern) !== null
}

/**
 * Checks if an operation matches a pattern for a given filter type (`tag`, `operationId`, `path`, `method`).
 */
function matchesOperationPattern(node: OperationNode, type: string, pattern: string | RegExp): boolean {
  if (type === 'tag') return node.tags.some((tag) => testPattern(tag, pattern))
  if (type === 'operationId') return testPattern(node.operationId, pattern)
  if (type === 'path') return node.path !== undefined && testPattern(node.path, pattern)
  if (type === 'method') return node.method !== undefined && testPattern(node.method.toLowerCase(), pattern)
  if (type === 'contentType') return node.requestBody?.content?.some((c) => testPattern(c.contentType, pattern)) ?? false
  return false
}

/**
 * Checks if a schema matches a pattern for a given filter type (`schemaName`).
 *
 * Returns `null` when the filter type doesn't apply to schemas.
 */
function matchesSchemaPattern(node: SchemaNode, type: string, pattern: string | RegExp): boolean | null {
  if (type === 'schemaName') return node.name ? testPattern(node.name, pattern) : false
  return null
}

/**
 * Default name resolver used by `defineResolver`.
 *
 * - `camelCase` for `function` and `file` types.
 * - `PascalCase` for `type`.
 * - `camelCase` for everything else.
 */
function defaultResolver(name: string, type?: 'file' | 'function' | 'type' | 'const'): string {
  if (type === 'file' || type === 'function') return camelCase(name, { isFile: type === 'file' })
  if (type === 'type') return pascalCase(name)
  return camelCase(name)
}

/**
 * Default option resolver. Applies include/exclude filters and merges matching override options.
 *
 * Returns `null` when the node is filtered out by an `exclude` rule or not matched by any `include` rule.
 *
 * @example Include/exclude filtering
 * ```ts
 * const options = defaultResolveOptions(operationNode, {
 *   options: { output: 'types' },
 *   exclude: [{ type: 'tag', pattern: 'internal' }],
 * })
 * // → null when node has tag 'internal'
 * ```
 *
 * @example Override merging
 * ```ts
 * const options = defaultResolveOptions(operationNode, {
 *   options: { enumType: 'asConst' },
 *   override: [{ type: 'operationId', pattern: 'listPets', options: { enumType: 'enum' } }],
 * })
 * // → { enumType: 'enum' } when operationId matches
 * ```
 */
const resolveOptionsCache = new WeakMap<object, WeakMap<Node, { value: unknown }>>()

function computeOptions<TOptions>(
  node: Node,
  options: TOptions,
  exclude: Array<PatternFilter>,
  include: Array<PatternFilter> | undefined,
  override: Array<PatternOverride<TOptions>>,
): TOptions | null {
  if (isOperationNode(node)) {
    if (exclude.some(({ type, pattern }) => matchesOperationPattern(node, type, pattern))) return null
    if (include && !include.some(({ type, pattern }) => matchesOperationPattern(node, type, pattern))) return null

    const overrideOptions = override.find(({ type, pattern }) => matchesOperationPattern(node, type, pattern))?.options

    return { ...options, ...overrideOptions }
  }

  if (isSchemaNode(node)) {
    if (exclude.some(({ type, pattern }) => matchesSchemaPattern(node, type, pattern) === true)) return null
    if (include) {
      const results = include.map(({ type, pattern }) => matchesSchemaPattern(node, type, pattern))
      const applicable = results.filter((result) => result !== null)

      if (applicable.length > 0 && !applicable.includes(true)) return null
    }
    const overrideOptions = override.find(({ type, pattern }) => matchesSchemaPattern(node, type, pattern) === true)?.options

    return { ...options, ...overrideOptions }
  }

  return options
}

export function defaultResolveOptions<TOptions>(
  node: Node,
  { options, exclude = [], include, override = [] }: ResolveOptionsContext<TOptions>,
): TOptions | null {
  const optionsKey = options as object
  let byOptions = resolveOptionsCache.get(optionsKey)
  if (!byOptions) {
    byOptions = new WeakMap()
    resolveOptionsCache.set(optionsKey, byOptions)
  }
  const cached = byOptions.get(node)
  if (cached !== undefined) return cached.value as TOptions | null

  const result = computeOptions(node, options, exclude, include, override)

  byOptions.set(node, { value: result })

  return result
}

/**
 * Default path resolver used by `defineResolver`.
 *
 * - `mode: 'file'` — resolves directly to `output.path` (the full file path, extension included).
 * - `mode: 'directory'` (default) — resolves to `output.path/{baseName}`, or into a
 *   subdirectory when `group` and a `tag`/`path` value are provided.
 *
 * A custom `group.name` function overrides the default subdirectory naming.
 * For `tag` groups the default is the camelCased tag.
 * For `path` groups the default is the first path segment after `/`.
 *
 * @example Flat output
 * ```ts
 * defaultResolvePath({ baseName: 'petTypes.ts' }, { root: '/src', output: { path: 'types' } })
 * // → '/src/types/petTypes.ts'
 * ```
 *
 * @example Tag-based grouping
 * ```ts
 * defaultResolvePath(
 *   { baseName: 'petTypes.ts', tag: 'pets' },
 *   { root: '/src', output: { path: 'types' }, group: { type: 'tag' } },
 * )
 * // → '/src/types/pets/petTypes.ts'
 * ```
 *
 * @example Path-based grouping
 * ```ts
 * defaultResolvePath(
 *   { baseName: 'petTypes.ts', path: '/pets/list' },
 *   { root: '/src', output: { path: 'types' }, group: { type: 'path' } },
 * )
 * // → '/src/types/pets/petTypes.ts'
 * ```
 *
 * @example Single file (`mode: 'file'`)
 * ```ts
 * defaultResolvePath(
 *   { baseName: 'petTypes.ts' },
 *   { root: '/src', output: { path: 'types.ts', mode: 'file' } },
 * )
 * // → '/src/types.ts'
 * ```
 */
export function defaultResolvePath({ baseName, tag, path: groupPath }: ResolverPathParams, { root, output, group }: ResolverContext): string {
  const mode = output.mode ?? 'directory'

  if (mode === 'file') {
    return path.resolve(root, output.path)
  }

  const result: string = (() => {
    if (group && (groupPath || tag)) {
      const groupValue = group.type === 'path' ? groupPath! : tag!
      const defaultName =
        group.type === 'tag'
          ? ({ group: groupName }: { group: string }) => camelCase(groupName)
          : ({ group: groupName }: { group: string }) => {
              // Strip traversal components (empty, '.', '..') before taking the first meaningful segment.
              // When every segment is a traversal component (e.g. '../../') we fall back to '' so the
              // file is placed directly in the output root, and the boundary check below ensures safety.
              const segment = groupName.split('/').filter((part) => part !== '' && part !== '.' && part !== '..')[0]
              return segment ? camelCase(segment) : ''
            }
      const resolveName = group.name ?? defaultName
      const groupName = resolveName({ group: groupValue })

      return path.resolve(root, output.path, groupName, baseName)
    }
    return path.resolve(root, output.path, baseName)
  })()

  // Ensure the resolved path stays within the configured output directory.
  // This prevents path traversal from malicious OpenAPI specs or custom group.name functions.
  // `result === outputDir` is intentionally permitted: it matches edge cases where baseName
  // resolves to the output directory itself.
  const outputDir = path.resolve(root, output.path)
  const outputDirWithSep = outputDir.endsWith(path.sep) ? outputDir : `${outputDir}${path.sep}`
  if (result !== outputDir && !result.startsWith(outputDirWithSep)) {
    throw new Diagnostics.Error({
      code: Diagnostics.code.pathTraversal,
      severity: 'error',
      message: `Resolved path "${result}" is outside the output directory "${outputDir}".`,
      help: 'This can stem from a path traversal in the OpenAPI specification or a misconfigured `group.name` function. Keep generated paths within the output directory.',
      location: { kind: 'config' },
    })
  }

  return result
}

/**
 * Default file resolver used by `defineResolver`.
 *
 * Resolves a `FileNode` by combining name resolution (`resolver.default`) with
 * path resolution (`resolver.resolvePath`). The resolved file always has empty
 * `sources`, `imports`, and `exports` arrays, which consumers populate separately.
 *
 * In `mode: 'file'` the name is omitted and the file sits directly at the output path.
 *
 * @example Resolve a schema file
 * ```ts
 * const file = defaultResolveFile.call(
 *   resolver,
 *   { name: 'pet', extname: '.ts' },
 *   { root: '/src', output: { path: 'types' } },
 * )
 * // → { baseName: 'pet.ts', path: '/src/types/pet.ts', sources: [], ... }
 * ```
 *
 * @example Resolve an operation file with tag grouping
 * ```ts
 * const file = defaultResolveFile.call(
 *   resolver,
 *   { name: 'listPets', extname: '.ts', tag: 'pets' },
 *   { root: '/src', output: { path: 'types' }, group: { type: 'tag' } },
 * )
 * // → { baseName: 'listPets.ts', path: '/src/types/pets/listPets.ts', ... }
 * ```
 */
export function defaultResolveFile(this: Resolver, { name, extname, tag, path: groupPath }: ResolverFileParams, context: ResolverContext): FileNode {
  const mode = context.output.mode ?? 'directory'
  const resolvedName = mode === 'file' ? '' : this.default(name, 'file')
  const baseName = `${resolvedName}${extname}` as FileNode['baseName']
  const filePath = this.resolvePath({ baseName, tag, path: groupPath }, context)

  return createFile({
    path: filePath,
    baseName: path.basename(filePath) as `${string}.${string}`,
    meta: {
      pluginName: this.pluginName,
    },
    sources: [],
    imports: [],
    exports: [],
  })
}

/**
 * Generates the default "Generated by Kubb" banner from config and optional node metadata.
 */
export function buildDefaultBanner({
  title,
  description,
  version,
  config,
}: {
  title?: string
  description?: string
  version?: string
  config: Config
}): string {
  try {
    const source = (() => {
      if (Array.isArray(config.input)) {
        const first = config.input[0]
        if (first && 'path' in first) return path.basename(first.path)
        return ''
      }
      if (config.input && 'path' in config.input) return path.basename(config.input.path)
      if (config.input && 'data' in config.input) return 'text content'
      return ''
    })()

    let banner = '/**\n* Generated by Kubb (https://kubb.dev/).\n* Do not edit manually.\n'

    if (config.output.defaultBanner === 'simple') {
      banner += '*/\n'
      return banner
    }

    if (source) {
      banner += `* Source: ${source}\n`
    }

    if (title) {
      banner += `* Title: ${title}\n`
    }

    if (description) {
      const formattedDescription = description.replace(/\n/gm, '\n* ')
      banner += `* Description: ${formattedDescription}\n`
    }

    if (version) {
      banner += `* OpenAPI spec version: ${version}\n`
    }

    banner += '*/\n'
    return banner
  } catch (_error) {
    return '/**\n* Generated by Kubb (https://kubb.dev/).\n* Do not edit manually.\n*/'
  }
}

/**
 * Default banner resolver. Returns the banner string for a generated file.
 *
 * A user-supplied `output.banner` overrides the default Kubb "Generated by Kubb" notice.
 * When no `output.banner` is set, the Kubb notice is used (including `title` and `version`
 * from the document metadata when `meta` is provided).
 *
 * - When `output.banner` is a function, calls it with the file's `BannerMeta` and returns the result.
 * - When `output.banner` is a string, returns it directly.
 * - When `config.output.defaultBanner` is `false`, returns `undefined`.
 * - Otherwise returns the Kubb "Generated by Kubb" notice.
 *
 * @example String banner overrides default
 * ```ts
 * defaultResolveBanner(undefined, { output: { banner: '// my banner' }, config })
 * // → '// my banner'
 * ```
 *
 * @example Function banner with metadata
 * ```ts
 * defaultResolveBanner(meta, { output: { banner: (m) => `// v${m.version}` }, config })
 * // → '// v3.0.0'
 * ```
 *
 * @example Function banner skips re-export files
 * ```ts
 * defaultResolveBanner(meta, { output: { banner: (m) => (m.isBarrel ? '' : "'use server'") }, config, file: { path, baseName, isBarrel: true } })
 * // → ''
 * ```
 *
 * @example No user banner, Kubb notice with OAS metadata
 * ```ts
 * defaultResolveBanner(meta, { config })
 * // → '/** Generated by Kubb ... Title: Pet Store ... *\/'
 * ```
 *
 * @example Disabled default banner
 * ```ts
 * defaultResolveBanner(undefined, { config: { output: { defaultBanner: false }, ...config } })
 * // → null
 * ```
 */
export function defaultResolveBanner(meta: InputMeta | undefined, { output, config, file }: ResolveBannerContext): string | null {
  if (typeof output?.banner === 'function') {
    return output.banner(buildBannerMeta({ meta, file }))
  }

  if (typeof output?.banner === 'string') {
    return output.banner
  }

  if (config.output.defaultBanner === false) {
    return null
  }

  return buildDefaultBanner({
    title: meta?.title,
    version: meta?.version,
    config,
  })
}

/**
 * Default footer resolver. Returns the footer string for a generated file.
 *
 * - When `output.footer` is a function, calls it with the file's `BannerMeta` and returns the result.
 * - When `output.footer` is a string, returns it directly.
 * - Otherwise returns `undefined`.
 *
 * @example String footer
 * ```ts
 * defaultResolveFooter(undefined, { output: { footer: '// end of file' }, config })
 * // → '// end of file'
 * ```
 *
 * @example Function footer with metadata
 * ```ts
 * defaultResolveFooter(meta, { output: { footer: (m) => `// ${m.title}` }, config })
 * // → '// Pet Store'
 * ```
 */
export function defaultResolveFooter(meta: InputMeta | undefined, { output, file }: ResolveBannerContext): string | null {
  if (typeof output?.footer === 'function') {
    return output.footer(buildBannerMeta({ meta, file }))
  }
  if (typeof output?.footer === 'string') {
    return output.footer
  }
  return null
}

/**
 * Defines a plugin resolver. The resolver is the object that decides what
 * every generated symbol and file path is called. Built-in defaults handle
 * name casing, include/exclude/override filtering, output path computation,
 * and file construction. Supply your own to override any of them:
 *
 * - `default` sets the name casing strategy (camelCase or PascalCase).
 * - `resolveOptions` does include/exclude/override filtering.
 * - `resolvePath` computes the output path.
 * - `resolveFile` builds the full `FileNode`.
 * - `resolveBanner` and `resolveFooter` produce the top and bottom of file text.
 *
 * Methods in the returned object can call sibling resolver methods via `this`,
 * which keeps custom rules small (`this.default(name, 'type')` to delegate).
 *
 * @example Basic resolver with naming helpers
 * ```ts
 * export const resolverTs = defineResolver<PluginTs>(() => ({
 *   name: 'default',
 *   resolveName(name) {
 *     return this.default(name, 'function')
 *   },
 *   resolveTypeName(name) {
 *     return this.default(name, 'type')
 *   },
 * }))
 * ```
 *
 * @example Custom output path
 * ```ts
 * import path from 'node:path'
 *
 * export const resolverTs = defineResolver<PluginTs>(() => ({
 *   name: 'custom',
 *   resolvePath({ baseName }, { root, output }) {
 *     return path.resolve(root, output.path, 'generated', baseName)
 *   },
 * }))
 * ```
 */
export function defineResolver<T extends PluginFactoryOptions>(build: ResolverBuilder<T>): T['resolver'] {
  // `resolver` is kept so the default `resolveFile` wrapper can reference the fully assembled
  // object via `.call(resolver, ...)` at call-time, after the result is assigned below.
  let resolver: T['resolver']

  const result = {
    default: defaultResolver,
    resolveOptions: defaultResolveOptions,
    resolvePath: defaultResolvePath,
    resolveFile: (params: ResolverFileParams, context: ResolverContext) => defaultResolveFile.call(resolver as Resolver, params, context),
    resolveBanner: defaultResolveBanner,
    resolveFooter: defaultResolveFooter,
    ...build(),
  } as T['resolver']

  resolver = result

  return resolver
}
