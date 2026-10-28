import path from 'node:path'
import { camelCase } from '@internals/utils'
import { ast, collectImportedRefNames, type FileNode, type ImportNode, type InputMeta, type Node, type SchemaNode } from '@kubb/ast'
import { Diagnostics } from './Diagnostics.ts'
import { getInputKind } from './input.ts'
import type { Group, Output } from './definePlugin.ts'
import type { Config } from './types.ts'
import { resolveOptions, type ResolveOptionsContext } from './resolveOptions.ts'

export type { ResolveOptionsContext } from './resolveOptions.ts'

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
export type ResolverPathParams = Omit<ResolverFileParams, 'name' | 'extname'> & {
  baseName: FileNode['baseName']
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
 * Options for `resolver.imports`: the schema tree to scan (`node`) and where the generated
 * files live (`root`, `output`, `group`). Pass `name` to override how a referenced schema
 * name becomes the imported identifier; it defaults to the resolver's top-level `name`.
 *
 * @example
 * ```ts
 * resolver.imports({ node, root, output, group })
 * // → [{ kind: 'Import', name: ['pet'], path: '/src/types/pet.ts' }]
 * ```
 */
export type ResolveImportsOptions = {
  /**
   * Schema tree scanned for `$ref` occurrences. Each ref contributes one import entry.
   */
  node: SchemaNode
  root: string
  output: Output
  group?: Group
  /**
   * Extension of the generated files the imports point at.
   *
   * @default '.ts'
   */
  extname?: FileNode['extname']
  /**
   * Overrides how a referenced schema name becomes the imported identifier, for example to
   * point enum refs at a suffixed type name. Defaults to the resolver's top-level `name`.
   */
  name?: (schemaName: string) => string
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
  baseName?(this: Resolver, params: Pick<ResolverFileParams, 'name' | 'extname'>): FileNode['baseName']
  /**
   * Returns the file's complete path, resolved against the project `root`. Bypasses `output.path`
   * and `group`, so the resolver owns the layout. The returned path may not escape `root`. Reaches
   * sibling resolver helpers through `this`.
   */
  path?(this: Resolver, params: ResolverFilePathParams): string
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
}

/**
 * Reuse the declaration's key when resolving its references.
 */
export type ResolveNameOptions = {
  key: string | ReadonlyArray<string | undefined>
  name: string
  /**
   * Compares emitted identifiers while returning raw names. Keep numeric suffixes distinct.
   * Return several names when one declaration emits more than one identifier, such as an enum's
   * value and its type alias: the raw name is only taken when all of them are free.
   */
  normalize?: (name: string) => string | ReadonlyArray<string>
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
  imports?: T['imports']
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

/**
 * Builds a nested file path from a dotted name. Splits on dots that precede a letter
 * (so version numbers embedded in operationIds like `v2025.0` stay intact), camelCases
 * every segment, and joins with `/`.
 *
 * Empty segments are dropped before joining. They arise when the name starts with a dot
 * followed by a letter (e.g. `..Schema` splits into `['..', 'Schema']` and `'..'` cases to
 * an empty string). Without this a leading `/` would form, which `path.resolve` reads as an
 * absolute path, letting generated files escape the configured output directory.
 *
 * @example Nested path from a dotted name
 * `toFilePath('pet.petId') // 'pet/petId'`
 */
export function toFilePath(name: string): string {
  return name
    .split(/\.(?=[a-zA-Z])/)
    .map((part) => camelCase(part))
    .filter(Boolean)
    .join('/')
}

/** Throws `KUBB_PATH_TRAVERSAL` when `target` lies outside `parent`; `target === parent` stays allowed. */
function assertInside({ target, parent, message, help }: { target: string; parent: string; message: string; help: string }): void {
  const parentWithSep = parent.endsWith(path.sep) ? parent : `${parent}${path.sep}`
  if (target === parent || target.startsWith(parentWithSep)) return

  throw new Diagnostics.Error({
    code: Diagnostics.code.pathTraversal,
    severity: 'error',
    message,
    help,
    location: { kind: 'config' },
  })
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
 * The built-in machinery lives under `default`. Generators call the top-level `name`, `file`,
 * and `imports`, and a plugin overrides `name` and `file` to set its conventions. Extend with
 * top-level helpers (`typeName`, …) and/or grouped namespaces (`query`, `schema`, …).
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
  /** The built-in machinery, untouched by `name`/`file` overrides and built once since the driver reads it per node. */
  readonly default: ResolverDefault
  #options: ResolverBuildOptions
  #memo = new Map<string, unknown>()
  #usedNames = new Set<string>()
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
    this.default = {
      name: camelCase,
      options: resolveOptions,
      path: this.#resolvePath.bind(this),
      file: this.#resolveFile.bind(this),
      banner: this.#resolveBanner.bind(this),
      footer: this.#resolveFooter.bind(this),
    }
    this.#apply(options)
  }

  /** Exposes the raw build options so `Resolver.merge` can read them across `@kubb/core` copies. */
  get [resolverOptions](): ResolverBuildOptions {
    return this.#options
  }

  name(name: string): string {
    return this.default.name(name)
  }

  /**
   * Returns what `compute` produced the first time this build asked for `key`. A resolver lives for one
   * build, so wrap naming work a generator repeats per node, such as casing, and compute it once.
   *
   * @example
   * `name(name) { return this.memo(`name:${name}`, () => pascalCase(name)) }`
   */
  memo<T>(key: string, compute: () => T): T {
    if (this.#memo.has(key)) return this.#memo.get(key) as T
    const value = compute()
    this.#memo.set(key, value)
    return value
  }

  /**
   * Reserves emitted identifiers before allocating other declarations. The driver reserves component
   * names. Reserve extra identifiers, such as enum type aliases, before calling `resolveName`.
   *
   * @example Reserve an enum's type and value names
   * ```ts
   * resolver.reserveNames(['petStatusEnum', 'PetStatusEnumKey'])
   * ```
   */
  reserveNames(names: Iterable<string>): void {
    for (const name of names) this.#usedNames.add(name)
  }

  /**
   * Returns the same name for repeated declaration keys. Adds numeric suffixes starting at `2`
   * when the preferred name is taken. Array segment order and boundaries matter. String and array
   * keys are distinct. Pass an already-cased name or use `normalize` to compare emitted identifiers
   * while returning raw names. `Resolver.merge` creates a resolver with no reservations.
   *
   * @example Resolve a request body that collides with a component
   * ```ts
   * resolver.reserveNames(['CreateContainerBody'])
   * resolver.resolveName({ key: ['operation', 'POST', '/containers', 'body'], name: 'CreateContainerBody' })
   * // 'CreateContainerBody2'
   * ```
   *
   * @example Resolve a name that has to be free as both an enum value and a type alias
   * ```ts
   * resolver.resolveName({ key: ['enum', 'Pet', 'status'], name: 'Status', normalize: (name) => [camelCase(name), `${name}Key`] })
   * ```
   */
  resolveName({ key, name, normalize = (name: string) => name }: ResolveNameOptions): string {
    // Length-prefixed segments cannot collide whatever they contain, and this stays cheaper than `JSON.stringify`.
    const cacheKey = typeof key === 'string' ? `s:${key}` : `a:${key.map((segment) => (segment === undefined ? 'u' : `${segment.length}:${segment}`)).join('')}`
    return this.memo(`resolveName:${cacheKey}`, () => {
      const emitted = (value: string): ReadonlyArray<string> => {
        const names = normalize(value)
        return typeof names === 'string' ? [names] : names
      }
      let result = name
      let names = emitted(result)
      for (let suffix = 2; names.some((emittedName) => this.#usedNames.has(emittedName)); suffix++) {
        result = `${name}${suffix}`
        names = emitted(result)
      }
      this.reserveNames(names)
      return result
    })
  }

  file(options: ResolveFileOptions): FileNode {
    return this.#resolveFile(options)
  }

  /**
   * Builds one `ImportNode` per unique schema referenced in the tree, in first-occurrence
   * order. Each ref's target resolves through `resolveRefName`, so collision- or macro-renamed
   * schemas (`targetName`) import the emitted name. Names and paths go through the top-level
   * `name` and `file`, so import entries follow the plugin's conventions, and a per-call
   * `name` override wins over both.
   *
   * The subtree scan runs through `collectImportedRefNames`, which memoizes by node identity, so a
   * schema shared across the ts, zod, and faker plugins is walked once and every plugin's resolver
   * reads the same ref set instead of re-scanning it per plugin.
   */
  imports(options: ResolveImportsOptions): Array<ImportNode> {
    const { node, root, output, group, extname = '.ts', name } = options
    const resolveName = name ?? ((schemaName: string) => this.name(schemaName))

    return collectImportedRefNames(node).map((schemaName) =>
      ast.factory.createImport({
        name: [resolveName(schemaName)],
        path: this.#resolveFilePath({ name: schemaName, extname, root, output, group }),
      }),
    )
  }

  /**
   * Folds each `override` over `base`, left to right, and returns a new resolver with helpers
   * re-bound. Top-level keys replace, and a namespace (or `file`) merges per method, so overriding
   * `query.name` keeps the base `query.keyName`. The last override wins per key. Used when applying
   * `setResolver` partial overrides, and to compose shared resolver fragments without spreading each
   * namespace by hand. Reads a resolver's options through the shared brand rather than `instanceof`,
   * so a `file` override survives even when `base` and `override` come from different `@kubb/core`
   * copies.
   *
   * @example Fold several partial overrides onto a resolver
   * ```ts
   * const resolver = Resolver.merge(defaultResolver, sharedNamingPatch, { name: (name) => name.toUpperCase() })
   * ```
   */
  static merge<T extends Resolver>(base: T, ...overrides: Array<ResolverPatch<T> | Resolver>): T {
    const merged = overrides.reduce<Record<string, unknown>>(
      (acc, override) => {
        const patch = resolverOptions in override ? override[resolverOptions] : override
        for (const [key, value] of Object.entries(patch)) {
          if (value === undefined) continue
          const current = acc[key]
          acc[key] = isNamespace(value) && isNamespace(current) ? { ...current, ...value } : value
        }
        return acc
      },
      { ...base[resolverOptions] },
    )
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
   * `mode: 'file'` (default) resolves directly to `output.path`. `mode: 'directory'` resolves
   * to `output.path/{baseName}`, or into a subdirectory when `group` and a `tag`/`path` value
   * are provided.
   */
  #resolvePath({ baseName, tag, path: groupPath, root, output, group }: ResolvePathOptions): string {
    if (output.mode !== 'directory') {
      return path.resolve(root, output.path)
    }

    const outputDir = path.resolve(root, output.path)
    // A file without the value its group needs (an SDK class per tag, grouped by path) is not grouped.
    const groupValue = group?.type === 'path' ? groupPath : tag
    const result = group && groupValue ? path.resolve(outputDir, Resolver.#resolveGroupDir(group, groupValue), baseName) : path.resolve(outputDir, baseName)

    assertInside({
      target: result,
      parent: outputDir,
      message: `Resolved path "${result}" is outside the output directory "${outputDir}".`,
      help: 'This can stem from a path traversal in the OpenAPI specification or a misconfigured `group.name` function. Keep generated paths within the output directory.',
    })

    return result
  }

  /**
   * Resolves a resolver-supplied full path (`file.path`) against `root`, bypassing `output.path`
   * and `group`. The path may not escape `root`, which keeps a `file.path` that interpolates
   * spec-derived values from writing outside the project.
   */
  #resolveOverridePath(filePath: string, root: string): string {
    const resolved = path.resolve(root, filePath)
    assertInside({
      target: resolved,
      parent: root,
      message: `Resolved path "${resolved}" is outside the project root "${root}".`,
      help: 'A resolver `file.path` must return a path inside the project root.',
    })

    return resolved
  }

  /** The absolute path `#resolveFile` places a file at. */
  #resolveFilePath({ name, extname, tag, path: groupPath, root, output, group }: ResolveFileOptions): string {
    const baseName = this.#baseName({ name, extname })
    return this.#filePath
      ? this.#resolveOverridePath(this.#filePath({ baseName, output }), root)
      : this.#resolvePath({ baseName, tag, path: groupPath, root, output, group })
  }

  /**
   * Builds a `FileNode`. When `#filePath` (the resolver's `file.path`) is set it owns the whole
   * path; otherwise the base name (from `#baseName`, the resolver's `file.baseName` or the
   * built-in `toBaseName`) is placed by the `output.path`/`group` layout. The resolved file starts
   * with empty `sources`, `imports`, and `exports`, which consumers populate separately.
   */
  #resolveFile(options: ResolveFileOptions): FileNode {
    const filePath = this.#resolveFilePath(options)

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
      const input = config.input
      const source = typeof input === 'string' ? (getInputKind(input) === 'inline' ? 'text content' : path.basename(input)) : input ? 'text content' : ''

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
