import path from 'node:path'
import { camelCase, toFilePath } from '@internals/utils'
import { ast, operationDef, schemaDef, type FileNode, type InputMeta, type Node, type OperationNode, type SchemaNode } from '@kubb/ast'
import { Diagnostics } from './diagnostics.ts'
import type { Filter, Override, PluginFactoryOptions } from './definePlugin.ts'
import type { Config, Group, Output } from './types.ts'

/**
 * Context for resolving filtered options for a given operation or schema node.
 *
 * @internal
 */
export type ResolveOptionsContext<TOptions> = {
  options: TOptions
  exclude?: Array<Filter>
  include?: Array<Filter>
  override?: Array<Override<TOptions>>
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

// String patterns are compiled lazily and cached, so the same filter is reused for every node.
const stringPatternCache = new Map<string, RegExp>()

function testPattern(value: string, pattern: string | RegExp): boolean {
  if (typeof pattern === 'string') {
    let regex = stringPatternCache.get(pattern)
    regex ??= new RegExp(pattern)
    stringPatternCache.set(pattern, regex)
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
  exclude: Array<Filter>,
  include: Array<Filter> | undefined,
  override: Array<Override<TOptions>>,
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
 * Resolves the subdirectory name for a grouped file. A custom `group.name` wins; otherwise `tag`
 * groups use the camelCased tag and `path` groups use the first non-traversal segment (`''` when
 * none remain, placing the file in the output root — the caller's boundary check keeps it safe).
 */
function resolveGroupDir(group: Group, groupValue: string): string {
  if (group.name) return group.name({ group: groupValue })
  if (group.type === 'tag') return camelCase(groupValue)
  const segment = groupValue.split('/').filter((part) => part !== '' && part !== '.' && part !== '..')[0]
  return segment ? camelCase(segment) : ''
}

/**
 * Default path resolver used by `createResolver`.
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

  const outputDir = path.resolve(root, output.path)
  const result =
    group && (groupPath || tag) ? path.resolve(outputDir, resolveGroupDir(group, group.type === 'path' ? groupPath! : tag!), baseName) : path.resolve(outputDir, baseName)

  // Ensure the resolved path stays within the configured output directory.
  // This prevents path traversal from malicious OpenAPI specs or custom group.name functions.
  // `result === outputDir` is intentionally permitted: it matches edge cases where baseName
  // resolves to the output directory itself.
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
 * Default file resolver used by `createResolver`, exposed as `resolver.default.file`.
 *
 * Resolves a `FileNode` by combining file-name casing (`params.resolveName`, default `toFilePath`)
 * with path resolution (`resolver.default.path`). The resolved file always has empty
 * `sources`, `imports`, and `exports` arrays, which consumers populate separately.
 *
 * In `mode: 'file'` the name is omitted and the file sits directly at the output path.
 *
 * The resolver is passed explicitly so the builder reaches `resolver.default.path` and
 * `resolver.pluginName` without `this`.
 *
 * @example Resolve a schema file
 * ```ts
 * const file = resolver.default.file({ name: 'pet', extname: '.ts' }, { root: '/src', output: { path: 'types' } })
 * // → { baseName: 'pet.ts', path: '/src/types/pet.ts', sources: [], ... }
 * ```
 *
 * @example Resolve an operation file with tag grouping
 * ```ts
 * const file = resolver.default.file(
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
 * Raw resolver fields passed to `createResolver`, or patched through `Resolver.merge` / `setResolver`.
 * `default` is the built-in machinery and is not user-settable — it's injected by the constructor.
 */
type ResolverBuildOptions = {
  pluginName: string
  name?: (name: string) => string
  file?: (params: ResolverFileParams, context: ResolverContext) => FileNode
  [key: string]: unknown
}

export type ResolverOverride = Omit<ResolverBuildOptions, 'pluginName'>

/**
 * The built-in `default` helpers, injected into every resolver. `file` is excluded here and set
 * per-resolver by `createResolver`, since it closes over the resolver to reach `default.path` and
 * `pluginName`.
 */
const builtinDefault: Omit<ResolverDefault, 'file'> = {
  name: camelCase,
  options: defaultResolveOptions,
  path: defaultResolvePath,
  banner: defaultResolveBanner,
  footer: defaultResolveFooter,
}

function isNamespace(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * The plugin-specific resolver fields handed to `createResolver`.
 *
 * `name` and `file` are optional — the built-ins are injected when omitted. `default` is the built-in
 * machinery and is not settable; delegate to it via `this.default.*` and customize file naming through
 * the top-level `file` entry. Every method reaches sibling helpers through `this`, which `ThisType`
 * types as the full resolver.
 */
type ResolverOptions<T extends PluginFactoryOptions> = Omit<T['resolver'], keyof Resolver> & {
  pluginName: T['name']
  name?: T['resolver']['name']
  file?: T['resolver']['file']
} & ThisType<T['resolver']>

/**
 * Populates `resolver` from `options`: injects the built-in `default` machinery, then binds each
 * remaining entry to the resolver root so `this.name`, `this.default`, and `this.file` resolve there.
 * Top-level helpers (`name`, `file`, `typeName`, …) and namespace methods (`query.name`, …) are both
 * handled by the generic loop; omitted `name`/`file` fall back to the class prototype. `default` is
 * skipped so it can't be shadowed — it's not part of the settable options.
 */
function applyResolverOptions(resolver: Resolver, options: ResolverBuildOptions): void {
  resolver.default = {
    ...builtinDefault,
    file: (params, context) => defaultResolveFile(resolver, params, context),
  }

  const root = resolver as Resolver & Record<string, unknown>

  for (const key of Object.keys(options)) {
    if (key === 'pluginName' || key === 'default') continue
    const value = options[key]
    if (isNamespace(value)) {
      const bound: Record<string, unknown> = {}
      for (const method of Object.keys(value)) {
        const member = value[method]
        bound[method] = typeof member === 'function' ? member.bind(root) : member
      }
      root[key] = bound
    } else if (typeof value === 'function') {
      root[key] = value.bind(root)
    } else if (value !== undefined) {
      root[key] = value
    }
  }
}

/**
 * Base constraint for all plugin resolver objects.
 *
 * The built-in machinery lives under `default`. `name` and `file` are the top-level entries generators
 * call; each defaults to its `default` counterpart and a plugin overrides it to set its convention.
 * Extend with top-level helpers (`typeName`, …) and/or grouped namespaces (`query`, `schema`, …).
 * Namespace and top-level helpers reach shared machinery through `this.name`, `this.default`, and
 * `this.file`.
 *
 * @example Top-level helper
 * ```ts
 * type MyResolver = Resolver & {
 *   typeName(name: string): string
 * }
 * ```
 *
 * @example Grouped namespace
 * ```ts
 * type MyResolver = Resolver & {
 *   query: {
 *     name(node: OperationNode): string
 *     keyName(node: OperationNode): string
 *   }
 * }
 * ```
 */
export class Resolver {
  readonly pluginName: string
  default!: ResolverDefault
  #options: ResolverBuildOptions
  name(name: string): string {
    return this.default.name(name)
  }
  file(params: ResolverFileParams, context: ResolverContext): FileNode {
    return this.default.file(params, context)
  }
  constructor(options: ResolverBuildOptions) {
    this.pluginName = options.pluginName
    this.#options = options
    applyResolverOptions(this, options)
  }
  /**
   * Merges `override` over `base` and returns a new resolver with helpers re-bound. Each key (`name`,
   * `file`, plugin namespaces) is replaced wholesale; `default` is rebuilt from the built-ins, never
   * carried over. Used by the framework when applying `setResolver` partial overrides.
   */
  static merge<T extends Resolver>(base: T, override: ResolverOverride | Resolver): T {
    const patch = override instanceof Resolver ? override.#options : override
    return createResolver({ ...base.#options, ...patch }) as T
  }
}

/**
 * Defines a plugin resolver — the object that decides what every generated symbol and file path is
 * called. The built-in machinery lives under `default` (`name` casing, `options` filtering, `path`,
 * the `file` builder, `banner`/`footer`). Generators call the top-level `name` and `file`, each of
 * which defaults to its `default` counterpart; override them to set the plugin's conventions, and add
 * your own naming helpers — top-level (`typeName`, …) or grouped in namespaces (`query`, `schema`, …).
 *
 * Every method reaches sibling helpers through `this`. Top-level methods get it from their call site
 * (`resolver.name(...)`); namespace methods are bound to the resolver so `this.name`, `this.default`,
 * and `this.file` resolve there too.
 *
 * @example Custom identifier and file casing
 * ```ts
 * export const resolverTs = createResolver<PluginTs>({
 *   pluginName: 'plugin-ts',
 *   name(name) {
 *     return ensureValidVarName(pascalCase(name))
 *   },
 *   file(params, context) {
 *     return this.default.file({ ...params, resolveName: (name) => toFilePath(name, pascalCase) }, context)
 *   },
 * })
 * ```
 */
export function createResolver<T extends PluginFactoryOptions>(options: ResolverOptions<T>): T['resolver'] {
  return new Resolver(options as unknown as ResolverBuildOptions) as T['resolver']
}
