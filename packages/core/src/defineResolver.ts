import path from 'node:path'
import { camelCase, toFilePath } from '@internals/utils'
import { ast, operationDef, schemaDef, type FileNode, type InputMeta, type Node, type OperationNode, type SchemaNode } from '@kubb/ast'
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
 * The built-in resolution machinery injected into every plugin resolver under `resolver.default`.
 *
 * A plugin rarely overrides these directly — it delegates to them via `this.default.*` and sets its
 * conventions through the top-level `name`/`file` entries instead. `name` is the built-in camelCase
 * identifier casing; `file` builds a `FileNode`; `options`, `path`, `banner`, and `footer` compute
 * the rest.
 */
export type ResolverDefault = {
  /**
   * Built-in camelCase casing for a generated identifier.
   */
  name(name: string): string
  options<TOptions>(node: Node, context: ResolveOptionsContext<TOptions>): TOptions | null
  path(params: ResolverPathParams, context: ResolverContext): string
  file(params: ResolverFileParams, context: ResolverContext): FileNode
  banner(meta: InputMeta | undefined, context: ResolveBannerContext): string | null
  footer(meta: InputMeta | undefined, context: ResolveBannerContext): string | null
}

/**
 * Base constraint for all plugin resolver objects.
 *
 * The built-in machinery lives under `default`. `name` and `file` are the top-level entries generators
 * call; each defaults to its `default` counterpart and a plugin overrides it to set its convention.
 * Extend this type with your own naming namespaces (for example `query`, `schema`) and reach the shared
 * helpers from them via `this.default`, `this.name`, and `this.file`.
 *
 * @example
 * ```ts
 * type MyResolver = Resolver & {
 *   query: {
 *     name(node: OperationNode): string
 *     keyName(node: OperationNode): string
 *   }
 * }
 * ```
 */
export type Resolver = {
  pluginName: string
  default: ResolverDefault
  /**
   * The plugin's identifier casing for a raw name. Defaults to `this.default.name`; override to set a
   * convention such as PascalCase or a suffixed variant.
   */
  name(name: string): string
  /**
   * Builds a `FileNode` for a generated file. Defaults to `this.default.file`; override for custom
   * file-name casing, usually by delegating to `this.default.file` with a `params.resolveName` caser.
   */
  file(params: ResolverFileParams, context: ResolverContext): FileNode
}

/**
 * File-specific parameters for `resolver.default.path`.
 *
 * Pass alongside a `ResolverContext` to identify which file to resolve.
 * Provide `tag` for tag-based grouping or `path` for path-based grouping.
 *
 * @example
 * ```ts
 * resolver.default.path(
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
 * Shared context passed as the second argument to `resolver.default.path` and `resolver.default.file`.
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
 * File-specific parameters for `resolver.default.file`.
 *
 * Pass alongside a `ResolverContext` to fully describe the file to resolve.
 * `tag` and `path` are used only when a matching `group` is present in the context.
 *
 * @example
 * ```ts
 * resolver.default.file(
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
  /**
   * Casing applied to `name` to build the file base name. Defaults to `toFilePath` (camelCase per
   * segment, dotted names split into nested directories). A plugin's `file` override threads its own
   * caser here to change file naming without reimplementing the builder.
   */
  resolveName?: (name: string) => string
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
 * Context passed to `resolver.default.banner` and `resolver.default.footer`.
 *
 * `output` is optional, since not every plugin configures a banner/footer.
 * `config` carries the global Kubb config, used to derive the default Kubb banner.
 * `file` carries per-file context forwarded to a `banner`/`footer` function.
 *
 * @example
 * ```ts
 * resolver.default.banner(meta, { output: { banner: '// generated' }, config })
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
 * `default`, `name`, and `file` are optional — the built-ins are injected when omitted. Plugin-specific
 * naming namespaces are required. Methods call sibling resolver methods via `this`, which `ThisType`
 * types as the full resolver. A `file` override receives its params/context and delegates to
 * `this.default.file`; a raw `default.file` factory receives the assembled resolver as its first argument.
 */
type ResolverBuilder<T extends PluginFactoryOptions> = () => Omit<T['resolver'], 'default' | 'name' | 'file' | 'pluginName'> & {
  pluginName: T['name']
  name?: T['resolver']['name']
  file?: T['resolver']['file']
  default?: Partial<Omit<ResolverDefault, 'file'>> & { file?: ResolverFileFactory<T['resolver']> }
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
 * Default casing for a generated identifier (camelCase). A plugin overrides this with its own
 * convention, for example PascalCase or a suffixed variant.
 */
function defaultName(name: string): string {
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
  if (operationDef.is(node)) {
    if (exclude.some(({ type, pattern }) => matchesOperationPattern(node, type, pattern))) return null
    if (include && !include.some(({ type, pattern }) => matchesOperationPattern(node, type, pattern))) return null

    const overrideOptions = override.find(({ type, pattern }) => matchesOperationPattern(node, type, pattern))?.options

    return { ...options, ...overrideOptions }
  }

  if (schemaDef.is(node)) {
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

function defaultResolveOptions<TOptions>(node: Node, { options, exclude = [], include, override = [] }: ResolveOptionsContext<TOptions>): TOptions | null {
  // A plugin's `options` is normally an object, but a re-instantiated plugin (e.g. a
  // Studio/agent merge) can hand back something falsy-but-not-nullish. `WeakMap` only
  // accepts object keys, so cache only when `options` actually qualifies; otherwise fall
  // back to computing directly instead of throwing "Invalid value used as weak map key".
  if (typeof options !== 'object' || options === null) {
    return computeOptions(node, options, exclude, include, override)
  }

  let byOptions = resolveOptionsCache.get(options)
  if (!byOptions) {
    byOptions = new WeakMap()
    resolveOptionsCache.set(options, byOptions)
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
 * - `mode: 'file'` resolves directly to `output.path` (the full file path, extension included).
 * - `mode: 'directory'` (default) resolves to `output.path/{baseName}`, or into a
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
 * Resolves a `FileNode` by combining file-name casing (`params.resolveName`, default `toFilePath`)
 * with path resolution (`resolver.default.path`). The resolved file always has empty
 * `sources`, `imports`, and `exports` arrays, which consumers populate separately.
 *
 * In `mode: 'file'` the name is omitted and the file sits directly at the output path.
 *
 * The assembled `resolver` is passed as the first argument so the builder never needs `this`.
 *
 * @example Resolve a schema file
 * ```ts
 * const file = defaultResolveFile(resolver, { name: 'pet', extname: '.ts' }, { root: '/src', output: { path: 'types' } })
 * // → { baseName: 'pet.ts', path: '/src/types/pet.ts', sources: [], ... }
 * ```
 *
 * @example Resolve an operation file with tag grouping
 * ```ts
 * const file = defaultResolveFile(
 *   resolver,
 *   { name: 'listPets', extname: '.ts', tag: 'pets' },
 *   { root: '/src', output: { path: 'types' }, group: { type: 'tag' } },
 * )
 * // → { baseName: 'listPets.ts', path: '/src/types/pets/listPets.ts', ... }
 * ```
 */
export function defaultResolveFile(
  resolver: Resolver,
  { name, extname, tag, path: groupPath, resolveName = toFilePath }: ResolverFileParams,
  context: ResolverContext,
): FileNode {
  const mode = context.output.mode ?? 'directory'
  const resolvedName = mode === 'file' ? '' : resolveName(name)
  const baseName = `${resolvedName}${extname}` as FileNode['baseName']
  const filePath = resolver.default.path({ baseName, tag, path: groupPath }, context)

  return ast.factory.createFile({
    path: filePath,
    baseName: path.basename(filePath) as `${string}.${string}`,
    meta: {
      pluginName: resolver.pluginName,
    },
    sources: [],
    imports: [],
    exports: [],
  })
}

/**
 * Generates the default "Generated by Kubb" banner from config and optional node metadata.
 */
function buildDefaultBanner({ title, description, version, config }: { title?: string; description?: string; version?: string; config: Config }): string {
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
 * Builds a `FileNode` from the assembled resolver and the file params. It receives the resolver as
 * its first argument so a `default.file` factory never needs `this` to reach `resolver.default.path`
 * or `resolver.pluginName`.
 */
export type ResolverFileFactory<TResolver extends Resolver = Resolver> = (resolver: TResolver, params: ResolverFileParams, context: ResolverContext) => FileNode

/**
 * A resolver override applied over a built resolver. Top-level members (`name`, `file`, plugin
 * namespaces) and `default` members are each optional, so an override can name a single helper
 * (`{ name }`, `{ default: { path } }`) without restating the rest.
 */
export type ResolverOverride<T extends Resolver> = Partial<Omit<T, 'default'>> & {
  default?: Partial<Omit<ResolverDefault, 'file'>> & { file?: ResolverFileFactory<T> | ResolverDefault['file'] }
}

/**
 * The built-in `default` helpers, injected into every resolver before a plugin's overrides. `file` is
 * wired separately by `wireFile`, since it needs the assembled resolver.
 */
const builtinDefault: Omit<ResolverDefault, 'file'> = {
  name: defaultName,
  options: defaultResolveOptions,
  path: defaultResolvePath,
  banner: defaultResolveBanner,
  footer: defaultResolveFooter,
}

/**
 * Default top-level `name`: the plugin's identifier casing, delegating to the built-in `default.name`.
 */
function defaultResolveName(this: Resolver, name: string): string {
  return this.default.name(name)
}

/**
 * Default top-level `file`: delegates to the built-in `default.file` builder.
 */
function defaultResolveFileEntry(this: Resolver, params: ResolverFileParams, context: ResolverContext): FileNode {
  return this.default.file(params, context)
}

// The wired `default.file` remembers its factory so a later merge can re-wire it over the merged resolver.
type WiredFile = ResolverDefault['file'] & { raw?: ResolverFileFactory }

/**
 * Points `resolver.default.file` at `factory`, closing over the assembled resolver, and remembers the
 * factory so a later merge re-wires it over the merged resolver.
 */
function wireFile<T extends Resolver>(resolver: T, factory: ResolverFileFactory<T>): T {
  const wired: WiredFile = (params, context) => factory(resolver, params, context)
  wired.raw = factory as ResolverFileFactory
  resolver.default.file = wired
  return resolver
}

type BoundMethod = ((...args: Array<unknown>) => unknown) & { raw?: (...args: Array<unknown>) => unknown }

function isNamespace(value: unknown): value is Record<string, BoundMethod> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Binds the method members of each plugin naming namespace (`query`, `schema`, …) to `resolver`, so a
 * namespace method reaches the resolver root through `this` (`this.name`, `this.default`). A single
 * shallow pass — `default` is skipped (its `file` is wired and the rest need no `this`). Each bound
 * method keeps its unbound original on `.raw`, so a later merge re-binds to the merged resolver.
 */
function bindNamespaces<T extends Resolver>(resolver: T): T {
  const root = resolver as Record<string, unknown>
  for (const key of Object.keys(root)) {
    if (key === 'default') continue
    const namespace = root[key]
    if (!isNamespace(namespace)) continue
    for (const methodKey of Object.keys(namespace)) {
      const method = namespace[methodKey]
      if (typeof method !== 'function') continue
      const raw = method.raw ?? method
      const bound = raw.bind(resolver) as BoundMethod
      bound.raw = raw
      namespace[methodKey] = bound
    }
  }
  return resolver
}

/**
 * Clones the plugin naming namespaces of `resolver` (fresh objects, methods reset to their unbound
 * originals) so a merge can rebind them without mutating the source resolver.
 */
function cloneNamespaces<T extends Resolver>(resolver: T): T {
  const clone = { ...resolver } as Record<string, unknown>
  for (const key of Object.keys(clone)) {
    if (key === 'default') continue
    const namespace = clone[key]
    if (!isNamespace(namespace)) continue
    const copy: Record<string, BoundMethod> = {}
    for (const methodKey of Object.keys(namespace)) {
      const method = namespace[methodKey]
      copy[methodKey] = (typeof method === 'function' ? (method.raw ?? method) : method) as BoundMethod
    }
    clone[key] = copy
  }
  return clone as T
}

/**
 * Merges a resolver `override` over `base` one level deep: top-level members (`name`, `file`, plugin
 * namespaces) and `default` members are replaced individually, so overriding a single helper keeps the
 * rest. The `default.file` factory is re-wired and namespace methods re-bound over the merged resolver.
 */
export function mergeResolver<T extends Resolver>(base: T, override: ResolverOverride<T>): T {
  const merged = {
    ...cloneNamespaces(base),
    ...override,
    default: { ...base.default, ...override.default },
  } as T
  // An override's `default.file` may be a raw factory or a wired `default.file` (when a whole resolver
  // is passed as the override), in which case its remembered `.raw` factory is the one to re-wire.
  const overrideFile = override.default?.file as (ResolverFileFactory & WiredFile) | undefined
  const factory = overrideFile?.raw ?? overrideFile ?? (base.default.file as WiredFile).raw ?? defaultResolveFile
  return bindNamespaces(wireFile(merged, factory as ResolverFileFactory<T>))
}

/**
 * Defines a plugin resolver — the object that decides what every generated symbol and file path is
 * called. The built-in machinery lives under `default` (`name` casing, `options` filtering, `path`,
 * the `file` builder, `banner`/`footer`). Generators call the top-level `name` and `file`, each of
 * which defaults to its `default` counterpart; override them to set the plugin's conventions, and add
 * your own naming namespaces (`query`, `schema`, …) to group the rest.
 *
 * Top-level methods reach sibling helpers through `this` (for example `this.default.name(name)`), and
 * namespace methods are bound so `this` is the resolver there too. A raw `default.file` factory is the
 * exception: it receives the assembled resolver as its first argument.
 *
 * @example Custom identifier and file casing
 * ```ts
 * export const resolverTs = defineResolver<PluginTs>(() => ({
 *   pluginName: 'plugin-ts',
 *   name(name) {
 *     return ensureValidVarName(pascalCase(name))
 *   },
 *   file(params, context) {
 *     return this.default.file({ ...params, resolveName: (name) => toFilePath(name, pascalCase) }, context)
 *   },
 * }))
 * ```
 *
 * @example Grouped naming namespace
 * ```ts
 * export const resolverReactQuery = defineResolver<PluginReactQuery>(() => ({
 *   pluginName: 'plugin-react-query',
 *   query: {
 *     name(node) {
 *       return `use${capitalize(this.name(node.operationId))}`
 *     },
 *   },
 * }))
 * ```
 */
export function defineResolver<T extends PluginFactoryOptions>(build: ResolverBuilder<T>): T['resolver'] {
  const built = build() as Record<string, unknown>
  const merged = {
    name: defaultResolveName,
    file: defaultResolveFileEntry,
    ...built,
    default: { ...builtinDefault, ...(built.default as object | undefined) },
  } as unknown as T['resolver']
  const factory = ((built.default as { file?: ResolverFileFactory } | undefined)?.file ?? defaultResolveFile) as ResolverFileFactory<T['resolver']>

  return bindNamespaces(wireFile(merged, factory))
}
