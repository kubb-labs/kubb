import path from 'node:path'
import { camelCase, pascalCase, toFilePath } from '@internals/utils'
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
 * Shared resolution helpers injected into every plugin resolver under `resolver.core`.
 *
 * The three naming helpers replace the old `default(name, type)` discriminator with one dedicated
 * helper per kind: `name` for runtime-value identifiers, `typeName` for type identifiers, and
 * `fileName` for file paths. `options`, `path`, `file`, `banner`, and `footer` compute the rest.
 *
 * Plugins override any of these by returning a partial `core` from `defineResolver`; unset members
 * keep the built-in behavior.
 */
export type ResolverCore = {
  /**
   * Casing for a runtime-value identifier — functions, consts, and variables. camelCase by default.
   */
  name(name: string): string
  /**
   * Casing for a type identifier. PascalCase by default.
   */
  typeName(name: string): string
  /**
   * Casing for a file path or base name, splitting dotted names into nested segments.
   */
  fileName(name: string): string
  options<TOptions>(node: Node, context: ResolveOptionsContext<TOptions>): TOptions | null
  path(params: ResolverPathParams, context: ResolverContext): string
  file(params: ResolverFileParams, context: ResolverContext): FileNode
  banner(meta: InputMeta | undefined, context: ResolveBannerContext): string | null
  footer(meta: InputMeta | undefined, context: ResolveBannerContext): string | null
}

/**
 * Base constraint for all plugin resolver objects.
 *
 * Shared helpers live under `core` (injected by `defineResolver`). Extend this type with your own
 * namespaces to group related naming methods, and reach the shared helpers from any of them via
 * `this.core`.
 *
 * @example
 * ```ts
 * type MyResolver = Resolver & {
 *   schema: {
 *     name(name: string): string
 *     typeName(name: string): string
 *   }
 * }
 * ```
 */
export type Resolver = {
  name: string
  pluginName: string
  core: ResolverCore
}

/**
 * File-specific parameters for `resolver.core.path`.
 *
 * Pass alongside a `ResolverContext` to identify which file to resolve.
 * Provide `tag` for tag-based grouping or `path` for path-based grouping.
 *
 * @example
 * ```ts
 * resolver.core.path(
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
 * Shared context passed as the second argument to `resolver.core.path` and `resolver.core.file`.
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
 * File-specific parameters for `resolver.core.file`.
 *
 * Pass alongside a `ResolverContext` to fully describe the file to resolve.
 * `tag` and `path` are used only when a matching `group` is present in the context.
 *
 * @example
 * ```ts
 * resolver.core.file(
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
 * resolver.core.banner(meta, { output: { banner: '// generated' }, config })
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
 * `core` is optional and merged over the built-in defaults, so a plugin can override just the
 * helpers it cares about. Plugin-specific namespaces are required. Methods call sibling resolver
 * methods via `this`; nested namespace methods must type their receiver explicitly
 * (`method(this: TResolver, …)`) since `ThisType` only reaches the top-level object.
 */
type ResolverBuilder<T extends PluginFactoryOptions> = () => Omit<T['resolver'], 'core' | 'name' | 'pluginName'> & {
  name: string
  pluginName: T['name']
  core?: Partial<ResolverCore>
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
 * Default casing for a runtime-value identifier (functions, consts, variables).
 */
function defaultName(name: string): string {
  return camelCase(name)
}

/**
 * Default casing for a type identifier.
 */
function defaultTypeName(name: string): string {
  return pascalCase(name)
}

/**
 * Default casing for a file path, splitting dotted names into `/`-joined nested segments.
 */
function defaultFileName(name: string): string {
  return toFilePath(name)
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
 * Resolves a `FileNode` by combining name resolution (`resolver.core.fileName`) with
 * path resolution (`resolver.core.path`). The resolved file always has empty
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
  const resolvedName = mode === 'file' ? '' : this.core.fileName(name)
  const baseName = `${resolvedName}${extname}` as FileNode['baseName']
  const filePath = this.core.path({ baseName, tag, path: groupPath }, context)

  return ast.factory.createFile({
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
 * The built-in `core` helpers, injected into every resolver before a plugin's overrides.
 */
const defaultCore: ResolverCore = {
  name: defaultName,
  typeName: defaultTypeName,
  fileName: defaultFileName,
  options: defaultResolveOptions,
  path: defaultResolvePath,
  file: defaultResolveFile,
  banner: defaultResolveBanner,
  footer: defaultResolveFooter,
}

// Marks the original, unbound implementation on a bound method, so re-binding after a later merge
// binds the true original to the new root instead of a function whose `this` is already frozen.
const originalFn = Symbol('kubb.resolver.original')

type BoundFn = ((...args: Array<unknown>) => unknown) & { [originalFn]?: (...args: Array<unknown>) => unknown }

/**
 * A recursively-optional resolver override: every namespace object is optional down to the leaf,
 * while methods and scalars keep their exact type. Lets an override name a single helper without
 * restating the rest of the tree.
 */
export type DeepPartial<T> = T extends (...args: Array<never>) => unknown ? T : T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

/**
 * Deep-merges a resolver `override` over `base`. Nested namespaces (`core`, and any plugin
 * namespace object) merge key by key, so overriding one helper keeps the sibling defaults;
 * functions and every non-plain value replace wholesale.
 */
export function mergeResolver<T>(base: T, override: DeepPartial<T>): T {
  const result: Record<string, unknown> = { ...(base as Record<string, unknown>) }

  for (const key of Object.keys(override as Record<string, unknown>)) {
    const overrideValue = (override as Record<string, unknown>)[key]
    if (overrideValue === undefined) continue

    const baseValue = result[key]
    result[key] = isPlainObject(baseValue) && isPlainObject(overrideValue) ? mergeResolver(baseValue, overrideValue) : overrideValue
  }

  return result as T
}

/**
 * Binds the methods inside each namespace (`core`, and any plugin namespace object) to `root`, so a
 * nested method reads the fully assembled resolver as `this` regardless of the namespace it is
 * called through (`resolver.schema.name()` still sees `this.core`). Top-level methods are left alone:
 * called on the resolver they already get the right `this`, and leaving them unbound keeps the
 * ergonomic `{ ...resolver, overrideMethod }` override pattern working. Re-runnable: it rebinds each
 * method's original implementation, so merging a resolver again and rebinding stays correct.
 */
export function bindResolver<T extends object>(root: T): T {
  const bindNested = (node: Record<string, unknown>): void => {
    for (const key of Object.keys(node)) {
      const value = node[key]
      if (typeof value === 'function') {
        const original = (value as BoundFn)[originalFn] ?? (value as BoundFn)
        const bound = original.bind(root) as BoundFn
        bound[originalFn] = original
        node[key] = bound
        continue
      }
      if (isPlainObject(value)) bindNested(value)
    }
  }

  for (const value of Object.values(root as Record<string, unknown>)) {
    if (isPlainObject(value)) bindNested(value)
  }
  return root
}

/**
 * Defines a plugin resolver — the object that decides what every generated symbol and file path is
 * called. Built-in helpers live under `core`: `name`/`typeName`/`fileName` for casing, `options`
 * for include/exclude/override filtering, `path` for the output path, `file` for the full
 * `FileNode`, and `banner`/`footer` for the top and bottom of file text. Return a partial `core` to
 * override any of them, and add your own namespaces to group plugin-specific naming methods.
 *
 * Methods reach sibling helpers through `this` (for example `this.core.typeName(name)`); the whole
 * tree is bound to the assembled resolver, so a nested namespace method still sees `this.core`.
 *
 * @example Naming helpers grouped in a namespace
 * ```ts
 * export const resolverTs = defineResolver<PluginTs>(() => ({
 *   name: 'default',
 *   pluginName: 'plugin-ts',
 *   schema: {
 *     name(this: ResolverTs, name) {
 *       return this.core.name(name)
 *     },
 *     typeName(this: ResolverTs, name) {
 *       return this.core.typeName(name)
 *     },
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
 *   pluginName: 'plugin-ts',
 *   core: {
 *     path({ baseName }, { root, output }) {
 *       return path.resolve(root, output.path, 'generated', baseName)
 *     },
 *   },
 * }))
 * ```
 */
export function defineResolver<T extends PluginFactoryOptions>(build: ResolverBuilder<T>): T['resolver'] {
  const base = { core: { ...defaultCore } } as T['resolver']
  const merged = mergeResolver<T['resolver']>(base, build() as DeepPartial<T['resolver']>)

  return bindResolver(merged as object) as T['resolver']
}
