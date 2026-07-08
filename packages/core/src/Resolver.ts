import path from 'node:path'
import { camelCase, toFilePath } from '@internals/utils'
import { ast, operationDef, schemaDef, type FileNode, type InputMeta, type Node, type OperationNode, type SchemaNode } from '@kubb/ast'
import { Diagnostics } from './Diagnostics.ts'
import type { Filter, Override } from './definePlugin.ts'
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
 * The built-in resolution machinery exposed on every resolver as `resolver.default`.
 * Plugins delegate to it via `this.default.*` and set their own conventions through
 * the top-level `name` and `file` entries.
 */
export type ResolverDefault = {
  /**
   * Built-in camelCase casing for a generated identifier.
   */
  name(name: string): string
  options<TOptions>(node: Node, context: ResolveOptionsContext<TOptions>): TOptions | null
  path(options: ResolvePathOptions): string
  file(options: ResolveFileOptions): FileNode
  banner(meta: InputMeta | undefined, context: ResolveBannerContext): string | null
  footer(meta: InputMeta | undefined, context: ResolveBannerContext): string | null
}

/**
 * The name request for `resolver.default.path`: a `baseName` plus the optional `tag`/`path` that
 * grouping keys off.
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
 * Options for `resolver.default.path`: the name request (`baseName`, `tag`, `path`) plus where the
 * output goes (`root`, `output`, `group`).
 *
 * @example
 * ```ts
 * resolver.default.path({ baseName: 'petTypes.ts', tag: 'pets', root: '/src', output: { path: 'types' }, group: { type: 'tag' } })
 * // → '/src/types/pets/petTypes.ts'
 * ```
 */
export type ResolvePathOptions = ResolverPathParams & {
  /**
   * Absolute project root that the output path is resolved against.
   */
  root: string
  /**
   * Active output config; `output.path` is the base directory.
   */
  output: Output
  /**
   * Optional grouping strategy applied to `tag` (tag grouping) or `path` (path grouping).
   */
  group?: Group
}

/**
 * The file request for `resolver.file` and `resolver.default.file`: the `name` and `extname` plus
 * the optional `tag`/`path` that grouping keys off.
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
 * Options for `resolver.file` and `resolver.default.file`: the file request (`name`, `extname`,
 * `tag`, `path`) plus where the output goes (`root`, `output`, `group`).
 *
 * @example
 * ```ts
 * resolver.default.file({ name: 'listPets', extname: '.ts', tag: 'pets', root: '/src', output: { path: 'types' }, group: { type: 'tag' } })
 * // → { baseName: 'listPets.ts', path: '/src/types/pets/listPets.ts', ... }
 * ```
 */
export type ResolveFileOptions = ResolverFileParams & {
  root: string
  output: Output
  group?: Group
}

/**
 * The `file` field of a resolver: decides what a generated file is called and, optionally, where
 * it lives. This is how a resolver renames or relocates its files, replacing the older per-call
 * `resolveName` hook.
 *
 * @example Suffix every generated file
 * ```ts
 * file: {
 *   baseName({ name, extname }) {
 *     return `${name}Faker${extname}`
 *   },
 * }
 * ```
 *
 * @example Own the full path
 * ```ts
 * file: {
 *   path({ baseName, output }) {
 *     return `${output.path}/mocks/${baseName}`
 *   },
 * }
 * ```
 */
export type ResolverFile = {
  /**
   * Builds the file's complete base name, extension included, from the identifier and the target
   * `extname`. Defaults to `toFilePath(name)` with `extname` appended. Reaches sibling resolver
   * helpers through `this`.
   */
  baseName?(params: Pick<ResolverFileParams, 'name' | 'extname'>): FileNode['baseName']
  /**
   * Returns the file's complete path, resolved against the project `root`. Bypasses `output.path`
   * and `group`, so the resolver owns the layout. The returned path may not escape `root`. Reaches
   * sibling resolver helpers through `this`.
   */
  path?(params: ResolverFilePathParams): string
}

/**
 * The argument to a resolver's `file.path`: the resolved `baseName` (what `file.baseName` produced,
 * with the extension already appended) and the active `output`. `tag`, `path`, and `group` are
 * omitted because `file.path` owns the whole path and bypasses grouping, and `root` because the
 * returned path is resolved against it.
 */
export type ResolverFilePathParams = {
  baseName: FileNode['baseName']
  output: Output
}

/**
 * Per-file context describing the file a banner/footer is being resolved for, so a
 * `banner`/`footer` function can branch on the file kind (e.g. skip a `'use server'`
 * directive on re-export files).
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
 * `output` is optional since not every plugin configures a banner/footer, and `config`
 * carries the global Kubb config used to derive the default Kubb banner.
 */
export type ResolveBannerContext = {
  output?: Pick<Output, 'banner' | 'footer'>
  config: Config
  file?: ResolveBannerFile
}

/**
 * Raw resolver fields passed to `createResolver` or patched through `Resolver.merge`.
 * `default` is the built-in machinery and is not user-settable.
 */
export type ResolverBuildOptions = {
  pluginName: string
  name?: (name: string) => string
  file?: ResolverFile
  [key: string]: unknown
}

/**
 * Partial resolver fields accepted by `Resolver.merge` and `setResolver`. Parameterize with a
 * concrete resolver type (e.g. `ResolverPatch<ResolverTs>`) to type-check overrides and bind
 * `this` to the full resolver. Namespaces are partial, so a patch may override a single method
 * (`query.name`) and the rest keep the plugin defaults. Overriding a whole resolver is not the
 * job of this patch, that is what a custom plugin is for.
 */
export type ResolverPatch<T extends Resolver = Resolver> = {
  [K in keyof Omit<T, keyof Resolver>]?: T[K] extends (...args: Array<never>) => unknown ? T[K] : Partial<T[K]>
} & {
  name?: T['name']
  file?: ResolverFile
} & ThisType<T>

function isNamespace(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Shared brand for reaching a resolver's build options. `Resolver.merge` reads this instead of
 * relying on `instanceof`, which fails when a CommonJS config and the ESM CLI each load their own
 * copy of `@kubb/core`. `Symbol.for` resolves to one key across those copies, so the options stay
 * reachable and a `file` override is never dropped.
 */
const resolverOptions: unique symbol = Symbol.for('@kubb/core/resolver/options')

function hasResolverOptions(value: object): value is { readonly [resolverOptions]: ResolverBuildOptions } {
  return resolverOptions in value
}

/**
 * Built-in `file.baseName`: casts the identifier with `toFilePath` and appends the extension.
 */
function toBaseName({ name, extname }: Pick<ResolverFileParams, 'name' | 'extname'>): FileNode['baseName'] {
  return `${toFilePath(name)}${extname}` as FileNode['baseName']
}

/**
 * Base constraint for all plugin resolver objects.
 *
 * The built-in machinery lives under `default`. Generators call the top-level `name` and
 * `file`, and a plugin overrides them to set its conventions. Extend with top-level helpers
 * (`typeName`, …) and/or grouped namespaces (`query`, `schema`, …).
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
  // String patterns are compiled lazily and cached, so the same filter is reused for every node.
  static #patternCache = new Map<string, RegExp>()
  static #optionsCache = new WeakMap<object, WeakMap<Node, { value: unknown }>>()

  readonly pluginName: string
  #options: ResolverBuildOptions
  // Base-name builder from `options.file.baseName`, bound to the resolver so it can reach `this`.
  // Defaults to `toBaseName` when a resolver sets no `file.baseName`.
  #baseName: (params: Pick<ResolverFileParams, 'name' | 'extname'>) => FileNode['baseName']
  // Full-path override from `options.file.path`, bound to the resolver. Absent by default, in which
  // case the built-in `output.path`/`group` layout is used.
  #filePath: ((params: ResolverFilePathParams) => string) | undefined

  constructor(options: ResolverBuildOptions) {
    this.pluginName = options.pluginName
    this.#options = options
    this.#baseName = options.file?.baseName ? options.file.baseName.bind(this) : toBaseName
    this.#filePath = options.file?.path ? options.file.path.bind(this) : undefined
    this.#apply(options)
  }

  /**
   * Exposes the raw build options so `Resolver.merge` can read them across `@kubb/core` copies.
   * Keyed by a shared `Symbol.for`, so it stays off the public API.
   */
  get [resolverOptions](): ResolverBuildOptions {
    return this.#options
  }

  /**
   * The built-in resolution machinery. Always reaches the untouched defaults, even when a
   * plugin overrides the top-level `name` or `file`.
   */
  get default(): ResolverDefault {
    return {
      name: camelCase,
      options: this.#resolveOptions.bind(this),
      path: this.#resolvePath.bind(this),
      file: this.#resolveFile.bind(this),
      banner: this.#resolveBanner.bind(this),
      footer: this.#resolveFooter.bind(this),
    }
  }

  name(name: string): string {
    return this.default.name(name)
  }

  file(options: ResolveFileOptions): FileNode {
    return this.#resolveFile(options)
  }

  /**
   * Merges `override` over `base` and returns a new resolver with helpers re-bound. Top-level
   * keys replace, and a namespace (or `file`) merges per method, so overriding `query.name`
   * keeps the base `query.keyName`. Used when applying `setResolver` partial overrides. Reads a
   * resolver's options through the shared brand rather than `instanceof`, so a `file` override
   * survives even when `base` and `override` come from different `@kubb/core` copies.
   */
  static merge<T extends Resolver>(base: T, override: ResolverPatch<T> | Resolver): T {
    const patch = hasResolverOptions(override) ? override[resolverOptions] : override
    const merged: Record<string, unknown> = { ...base[resolverOptions] }
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) continue
      const current = merged[key]
      merged[key] = isNamespace(value) && isNamespace(current) ? { ...current, ...value } : value
    }
    return new Resolver(merged as ResolverBuildOptions) as T
  }

  /**
   * Binds each entry of `options` onto the resolver, so `this.name`, `this.default`, and
   * `this.file` resolve there for top-level helpers and namespace methods alike. `default`
   * is skipped so it can't be shadowed.
   */
  #apply(options: ResolverBuildOptions): void {
    const root = this as Resolver & Record<string, unknown>
    const bind = (value: unknown) => (typeof value === 'function' ? value.bind(root) : value)

    for (const [key, value] of Object.entries(options)) {
      // `file` drives file naming through `#baseName`, not a top-level method, so it must not be
      // assigned here (it would shadow the `file` method with a plain `{ name }` object).
      if (key === 'pluginName' || key === 'default' || key === 'file' || value === undefined) continue
      root[key] = isNamespace(value) ? Object.fromEntries(Object.entries(value).map(([method, member]) => [method, bind(member)])) : bind(value)
    }
  }

  static #testPattern(value: string, pattern: string | RegExp): boolean {
    if (typeof pattern === 'string') {
      let regex = Resolver.#patternCache.get(pattern)
      regex ??= new RegExp(pattern)
      Resolver.#patternCache.set(pattern, regex)
      return regex.test(value)
    }
    // Use .match() for user-supplied RegExp to preserve semantics regardless of `g`/`y` flags.
    return value.match(pattern) !== null
  }

  static #matchesOperation(node: OperationNode, { type, pattern }: Filter): boolean {
    if (type === 'tag') return node.tags.some((tag) => Resolver.#testPattern(tag, pattern))
    if (type === 'operationId') return Resolver.#testPattern(node.operationId, pattern)
    if (type === 'path') return node.path !== undefined && Resolver.#testPattern(node.path, pattern)
    if (type === 'method') return node.method !== undefined && Resolver.#testPattern(node.method.toLowerCase(), pattern)
    if (type === 'contentType') return node.requestBody?.content?.some((c) => Resolver.#testPattern(c.contentType, pattern)) ?? false
    return false
  }

  /**
   * Returns `null` when the filter type doesn't apply to schemas, so include rules built
   * from operation filters (e.g. `tag`) don't exclude every schema.
   */
  static #matchesSchema(node: SchemaNode, { type, pattern }: Filter): boolean | null {
    if (type === 'schemaName') return node.name ? Resolver.#testPattern(node.name, pattern) : false
    return null
  }

  static #computeOptions<TOptions>(node: Node, { options, exclude = [], include, override = [] }: ResolveOptionsContext<TOptions>): TOptions | null {
    if (operationDef.is(node)) {
      if (exclude.some((filter) => Resolver.#matchesOperation(node, filter))) return null
      if (include && !include.some((filter) => Resolver.#matchesOperation(node, filter))) return null

      return { ...options, ...override.find((filter) => Resolver.#matchesOperation(node, filter))?.options }
    }

    if (schemaDef.is(node)) {
      if (exclude.some((filter) => Resolver.#matchesSchema(node, filter) === true)) return null
      if (include) {
        const applicable = include.map((filter) => Resolver.#matchesSchema(node, filter)).filter((result) => result !== null)
        if (applicable.length > 0 && !applicable.includes(true)) return null
      }

      return { ...options, ...override.find((filter) => Resolver.#matchesSchema(node, filter) === true)?.options }
    }

    return options
  }

  /**
   * Applies include/exclude filters and merges matching override options, caching the result
   * per `(options, node)` pair. Returns `null` when the node is filtered out.
   */
  #resolveOptions<TOptions>(node: Node, context: ResolveOptionsContext<TOptions>): TOptions | null {
    // A re-instantiated plugin can hand back a non-object `options`, which WeakMap rejects
    // as a key. Compute directly in that case instead of throwing.
    const { options } = context
    if (typeof options !== 'object' || options === null) {
      return Resolver.#computeOptions(node, context)
    }

    let byOptions = Resolver.#optionsCache.get(options)
    if (!byOptions) {
      byOptions = new WeakMap()
      Resolver.#optionsCache.set(options, byOptions)
    }

    const cached = byOptions.get(node)
    if (cached) return cached.value as TOptions | null

    const result = Resolver.#computeOptions(node, context)
    byOptions.set(node, { value: result })
    return result
  }

  /**
   * A custom `group.name` wins; otherwise `tag` groups use the camelCased tag and `path`
   * groups use the first non-traversal segment (`''` when none remain, placing the file in
   * the output root, kept safe by the caller's boundary check).
   */
  static #resolveGroupDir(group: Group, groupValue: string): string {
    if (group.name) return group.name({ group: groupValue })
    if (group.type === 'tag') return camelCase(groupValue)
    const segment = groupValue.split('/').filter((part) => part !== '' && part !== '.' && part !== '..')[0]
    return segment ? camelCase(segment) : ''
  }

  /**
   * `mode: 'file'` resolves directly to `output.path`. `mode: 'directory'` (default) resolves
   * to `output.path/{baseName}`, or into a subdirectory when `group` and a `tag`/`path` value
   * are provided.
   */
  #resolvePath({ baseName, tag, path: groupPath, root, output, group }: ResolvePathOptions): string {
    if (output.mode === 'file') {
      return path.resolve(root, output.path)
    }

    const outputDir = path.resolve(root, output.path)
    const result =
      group && (groupPath || tag)
        ? path.resolve(outputDir, Resolver.#resolveGroupDir(group, group.type === 'path' ? groupPath! : tag!), baseName)
        : path.resolve(outputDir, baseName)

    // Reject paths escaping the output directory: a malicious OpenAPI spec or a misconfigured
    // group.name function could otherwise write anywhere. `result === outputDir` stays allowed
    // for the edge case where baseName resolves to the output directory itself.
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
   * Resolves a resolver-supplied full path (`file.path`) against `root`, bypassing `output.path`
   * and `group`. The path may not escape `root`, which keeps a `file.path` that interpolates
   * spec-derived values from writing outside the project.
   */
  #resolveOverridePath(filePath: string, root: string): string {
    const resolved = path.resolve(root, filePath)
    const rootWithSep = root.endsWith(path.sep) ? root : `${root}${path.sep}`
    if (resolved !== root && !resolved.startsWith(rootWithSep)) {
      throw new Diagnostics.Error({
        code: Diagnostics.code.pathTraversal,
        severity: 'error',
        message: `Resolved path "${resolved}" is outside the project root "${root}".`,
        help: 'A resolver `file.path` must return a path inside the project root.',
        location: { kind: 'config' },
      })
    }

    return resolved
  }

  /**
   * Builds a `FileNode`. When `#filePath` (the resolver's `file.path`) is set it owns the whole
   * path; otherwise the base name (from `#baseName`, the resolver's `file.baseName` or the
   * built-in `toBaseName`) is placed by the `output.path`/`group` layout. The resolved file starts
   * with empty `sources`, `imports`, and `exports`, which consumers populate separately.
   */
  #resolveFile(options: ResolveFileOptions): FileNode {
    const { name, extname, tag, path: groupPath, root, output, group } = options
    const baseName = this.#baseName({ name, extname })
    const filePath = this.#filePath
      ? this.#resolveOverridePath(this.#filePath({ baseName, output }), root)
      : this.#resolvePath({ baseName, tag, path: groupPath, root, output, group })

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
   * Missing fields default to empty/`false` so the `BannerMeta` shape stays stable even when
   * a caller (e.g. the barrel plugin) has no document metadata.
   */
  static #buildBannerMeta(meta: InputMeta | undefined, file: ResolveBannerFile | undefined): BannerMeta {
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
   * Resolves a user-configured banner/footer value. `undefined` means not configured.
   */
  static #resolveUserText(
    value: string | ((meta: BannerMeta) => string) | undefined,
    meta: InputMeta | undefined,
    file: ResolveBannerFile | undefined,
  ): string | undefined {
    if (typeof value === 'function') return value(Resolver.#buildBannerMeta(meta, file))
    if (typeof value === 'string') return value
    return undefined
  }

  static #buildDefaultBanner({ title, version, config }: { title?: string; version?: string; config: Config }): string {
    const lines = ['/**', '* Generated by Kubb (https://kubb.dev/).', '* Do not edit manually.']

    if (config.output.defaultBanner !== 'simple') {
      const input = Array.isArray(config.input) ? config.input[0] : config.input
      const source = input && 'path' in input ? path.basename(input.path) : input && 'data' in input ? 'text content' : ''

      if (source) lines.push(`* Source: ${source}`)
      if (title) lines.push(`* Title: ${title}`)
      if (version) lines.push(`* OpenAPI spec version: ${version}`)
    }

    return `${lines.join('\n')}\n*/\n`
  }

  /**
   * A user-supplied `output.banner` overrides the default Kubb notice. When
   * `config.output.defaultBanner` is `false` and no user banner is set, returns `null`.
   */
  #resolveBanner(meta: InputMeta | undefined, { output, config, file }: ResolveBannerContext): string | null {
    const userBanner = Resolver.#resolveUserText(output?.banner, meta, file)
    if (userBanner !== undefined) return userBanner

    if (config.output.defaultBanner === false) return null

    return Resolver.#buildDefaultBanner({ title: meta?.title, version: meta?.version, config })
  }

  #resolveFooter(meta: InputMeta | undefined, { output, file }: ResolveBannerContext): string | null {
    return Resolver.#resolveUserText(output?.footer, meta, file) ?? null
  }
}
