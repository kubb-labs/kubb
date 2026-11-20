import type { FileNode, InputMeta, Node, SchemaNode } from '@kubb/ast'
import type { Config, Group, Output } from '@kubb/core'
import type { ResolveOptionsContext } from './resolveOptions.ts'
import type { Resolver } from './Resolver.ts'

/**
 * The built-in resolution machinery exposed on every resolver as `resolver.default`.
 * Plugins delegate to it via `this.default.*` and set their own conventions through
 * the top-level `name` and `file` entries.
 */
export type ResolverDefault = {
  /** Built-in camelCase casing for a generated identifier. */
  name(name: string): string
  options<TOptions>(node: Node, context: ResolveOptionsContext<TOptions>): TOptions | null
  path(options: ResolvePathOptions): string
  file(options: ResolveFileOptions): FileNode
  banner(meta: InputMeta | undefined, context: ResolveBannerContext): string | null
  footer(meta: InputMeta | undefined, context: ResolveBannerContext): string | null
}

/** The name request for `resolver.default.path`: a `baseName` plus the optional `tag`/`path` that grouping keys off. */
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
  /** Absolute directory the plugin's `output.path` is resolved against. Generators pass `ctx.root`, the config's output directory. */
  root: string
  /** Active output config; `output.path` is the base directory. */
  output: Output
  /** Optional grouping strategy applied to `tag` (tag grouping) or `path` (path grouping). */
  group?: Group
}

/**
 * The file request for `resolver.file` and `resolver.default.file`: the `name` and `extname` plus
 * the optional `tag`/`path` that grouping keys off. An operation file always passes `tag` or `path`,
 * since a file without either whose name matches a shared schema moves to `shared.path`.
 */
export type ResolverFileParams = {
  name: string
  extname: FileNode['extname']
  /** Tag value used when `group.type === 'tag'`. */
  tag?: string
  /** Path value used when `group.type === 'path'`. */
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
  /** Schema tree scanned for `$ref` occurrences. Each ref contributes one import entry. */
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
  /**
   * Also import the refs inside `conditionals`, `contains` and a string's `content`, for a plugin that prints those checks.
   *
   * @default false
   */
  checks?: boolean
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
  baseName?(this: ResolverLike, params: Pick<ResolverFileParams, 'name' | 'extname'>): FileNode['baseName']
  /**
   * Returns the file's complete path, resolved against the project `root`. Bypasses `output.path`
   * and `group`, so the resolver owns the layout. The returned path may not escape `root`. Reaches
   * sibling resolver helpers through `this`.
   */
  path?(this: ResolverLike, params: ResolverFilePathParams): string
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
  /** Full output path of the file being generated. */
  path: string
  /** File name only, e.g. `'stocks.ts'`. */
  baseName: string
  /** `true` for `index.ts` re-export barrels. */
  isBarrel?: boolean
  /** `true` for group `[dir]/[dir].ts` aggregation files. */
  isAggregation?: boolean
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

/** Raw resolver fields passed to `createResolver` or patched through `Resolver.merge`. `default` is the built-in machinery and is not user-settable. */
export type ResolverBuildOptions = {
  pluginName: string
  name?: (name: string) => string
  file?: ResolverFile
  /** The absolute `shared.path` and the shared schemas this build defines, set by the driver so `file` and `imports` place them under it. */
  shared?: { path: string; schemas: Array<string> }
}

/** Reuse the declaration's key when resolving its references. */
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

/** The public shape of a resolver. Types name this instead of the class, so a resolver from another copy of `@kubb/kit` fits them too. */
export type ResolverLike = Pick<Resolver, keyof Resolver>

/**
 * Partial resolver fields accepted by `Resolver.merge` and `setResolver`. Parameterize with a
 * concrete resolver type (e.g. `ResolverPatch<ResolverTs>`) to type-check overrides and bind
 * `this` to the full resolver. Namespaces are partial, so a patch may override a single method
 * (`query.name`) and the rest keep the plugin defaults. Overriding a whole resolver is not the
 * job of this patch, that is what a custom plugin is for.
 */
export type ResolverPatch<T extends ResolverLike = ResolverLike> = {
  [K in keyof Omit<T, keyof Resolver>]?: T[K] extends (...args: Array<never>) => unknown ? T[K] : Partial<T[K]>
} & {
  imports?: T['imports']
  name?: T['name']
  file?: ResolverFile
} & ThisType<T>

/** One resolver or patch, or a list of them merged left to right. */
export type ResolverInput<T extends ResolverLike = ResolverLike> = ResolverPatch<T> | T | ReadonlyArray<ResolverPatch<T> | T>

/**
 * Shared brand for reaching a resolver's build options. `Resolver.merge` reads this instead of
 * relying on `instanceof`, which fails when a CommonJS config and the ESM CLI each load their own
 * copy of `@kubb/kit`. `Symbol.for` resolves to one key across those copies, so the options stay
 * reachable and a `file` override is never dropped.
 */
export const resolverOptions: unique symbol = Symbol.for('@kubb/core/resolver/options')
