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
  path(params: ResolverPathParams, context: ResolverContext): string
  file(params: ResolverFileParams, context: ResolverContext): FileNode
  banner(meta: InputMeta | undefined, context: ResolveBannerContext): string | null
  footer(meta: InputMeta | undefined, context: ResolveBannerContext): string | null
}

/**
 * File-specific parameters for `resolver.default.path`.
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
 * Shared context passed as the second argument to `resolver.default.path` and
 * `resolver.default.file`: where output is rooted, which output config is active,
 * and the optional grouping strategy.
 */
export type ResolverContext = {
  root: string
  output: Output
  group?: Group
}

/**
 * File-specific parameters for `resolver.default.file`.
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
}

/**
 * The `file` field of a resolver: supply the base-name caser and Kubb applies it when building
 * every generated file's name. This is how a resolver renames its files, replacing the older
 * per-call `resolveName` hook.
 *
 * @example Suffix every generated file
 * ```ts
 * file: {
 *   name(name) {
 *     return `${name}Faker`
 *   },
 * }
 * ```
 */
export type ResolverFileName = {
  /**
   * Turns a generated identifier into the file's base name (without extension). Reaches sibling
   * resolver helpers through `this`.
   *
   * @default toFilePath
   */
  name(name: string): string
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
  file?: ResolverFileName
  [key: string]: unknown
}

/**
 * Partial resolver fields accepted by `Resolver.merge` and `setResolver`. Parameterize with a
 * concrete resolver type (e.g. `ResolverPatch<ResolverTs>`) to type-check namespace overrides
 * and bind `this` to the full resolver. The bare form accepts any resolver's fields.
 */
export type ResolverPatch<T extends Resolver = Resolver> = Partial<Omit<T, keyof Resolver>> & {
  name?: T['name']
  file?: ResolverFileName
} & ThisType<T>

function isNamespace(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
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
  // Base-name caser from `options.file.name`, bound to the resolver so it can reach `this`.
  // Defaults to `toFilePath` when a resolver sets no `file`.
  #fileName: (name: string) => string

  constructor(options: ResolverBuildOptions) {
    this.pluginName = options.pluginName
    this.#options = options
    this.#fileName = options.file ? options.file.name.bind(this) : toFilePath
    this.#apply(options)
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

  file(params: ResolverFileParams, context: ResolverContext): FileNode {
    return this.#resolveFile(params, context, this.#fileName)
  }

  /**
   * Merges `override` over `base` and returns a new resolver with helpers re-bound.
   * Each key is replaced wholesale. Used when applying `setResolver` partial overrides.
   */
  static merge<T extends Resolver>(base: T, override: ResolverPatch<T> | Resolver): T {
    const patch = override instanceof Resolver ? override.#options : override
    return new Resolver({ ...base.#options, ...patch }) as T
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
      // `file` drives file naming through `#fileName`, not a top-level method, so it must not be
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
  #resolvePath({ baseName, tag, path: groupPath }: ResolverPathParams, { root, output, group }: ResolverContext): string {
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
   * Builds a `FileNode` by combining file-name casing (`resolveName`, the resolver's `file.name`
   * or the built-in `toFilePath`) with path resolution. The resolved file starts with empty
   * `sources`, `imports`, and `exports`, which consumers populate separately.
   */
  #resolveFile(
    { name, extname, tag, path: groupPath }: ResolverFileParams,
    context: ResolverContext,
    resolveName: (name: string) => string = toFilePath,
  ): FileNode {
    const resolvedName = context.output.mode === 'file' ? '' : resolveName(name)
    const filePath = this.#resolvePath({ baseName: `${resolvedName}${extname}` as FileNode['baseName'], tag, path: groupPath }, context)

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
