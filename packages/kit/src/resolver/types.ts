import type { FileNode, InputMeta, Node, OperationNode, SchemaNode } from '@kubb/ast'
import type { Config, Group, Output } from '@kubb/core'
import type { ResolveOptionsContext } from './resolveOptions.ts'
import type { Resolver } from './Resolver.ts'

/** The built-in resolution machinery exposed on every resolver as `resolver.default`. */
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

/** Options for `resolver.default.path`: the name request (`baseName`, `tag`, `path`) plus where the output goes (`root`, `output`, `group`). */
export type ResolvePathOptions = ResolverPathParams & {
  /** Absolute directory the plugin's `output.path` is resolved against. Generators pass `ctx.root`, the config's output directory. */
  root: string
  /** Active output config; `output.path` is the base directory. */
  output: Output
  /** Optional grouping strategy applied to `tag` (tag grouping) or `path` (path grouping). */
  group?: Group
}

/** The file request for `resolver.file` and `resolver.default.file`: the `name` and `extname` plus the optional `tag`/`path` that grouping keys off. */
export type ResolverFileParams = {
  name: string
  extname: FileNode['extname']
  /** Tag value used when `group.type === 'tag'`. */
  tag?: string
  /** Path value used when `group.type === 'path'`. */
  path?: string
}

/** Options for `resolver.file` and `resolver.default.file`: the file request (`name`, `extname`, `tag`, `path`) plus where the output goes (`root`, `output`, `group`). */
export type ResolveFileOptions = ResolverFileParams & {
  root: string
  output: Output
  group?: Group
}

/** Options for `resolver.imports`: the schema tree to scan (`node`) and where the generated files live (`root`, `output`, `group`). */
export type ResolveImportsOptions = {
  /** Schema tree scanned for `$ref` occurrences. Each ref contributes one import entry. */
  node: SchemaNode
  root: string
  output: Output
  group?: Group
  /** Extension of the generated files the imports point at. @default '.ts' */
  extname?: FileNode['extname']
  /** Overrides how a referenced schema name becomes the imported identifier, for example to point enum refs at a suffixed type name. */
  name?: (schemaName: string) => string
  /** Also import the refs inside `conditionals`, `contains` and a string's `content`, for a plugin that prints those checks. @default false */
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
  /** A node's file name before casing. `exportName` is the name being imported, for a plugin with several files per node. `undefined` keeps the default. */
  name?(this: Resolver, node: SchemaNode | OperationNode, exportName?: string): string | undefined
  /** `false` keeps an operation file's name when it matches a schema file. Defaults to `true`, which adds `Operation`. */
  suffix?: boolean
  /** Builds the file's complete base name, extension included, from the identifier and the target `extname`. */
  baseName?(this: Resolver, params: Pick<ResolverFileParams, 'name' | 'extname'>): FileNode['baseName']
  /** Returns the file's complete path, resolved against the project `root`. It bypasses `output.path` and `group`, and may not escape `root`. */
  path?(this: Resolver, params: ResolverFilePathParams): string
}

/** The argument to a resolver's `file.path`: the resolved `baseName` (what `file.baseName` produced, with the extension already appended) and the active `output`. */
export type ResolverFilePathParams = {
  baseName: FileNode['baseName']
  output: Output
}

/** Per-file context describing the file a banner/footer is being resolved for, so a `banner`/`footer` function can branch on the file kind (e.g. skip a `'use server'` directive on re-export files). */
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

/** Context passed to `resolver.default.banner` and `resolver.default.footer`. */
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
  /**
   * Imports this resolver's names with `import type`, as `from()` and `code` emit them.
   */
  isTypeOnly?: boolean
  /** The absolute `shared.path` and the shared schemas this build defines, set by the driver so `file` and `imports` place them under it. */
  shared?: { path: string; schemas: Array<string> }
}

/** Reuse the declaration's key when resolving its references. */
export type ResolveNameOptions = {
  key: string | ReadonlyArray<string | undefined>
  name: string
  /** Compares emitted identifiers while returning raw names. Return several names when one declaration emits more than one identifier. */
  normalize?: (name: string) => string | ReadonlyArray<string>
}

/** Partial resolver fields accepted by `Resolver.merge` and `setResolver`. Namespaces are partial, so a patch can replace one method and keep the rest. */
export type ResolverPatch<T extends Resolver = Resolver> = {
  [K in keyof Omit<T, keyof Resolver>]?: T[K] extends (...args: Array<never>) => unknown ? T[K] : Partial<T[K]>
} & {
  imports?: T['imports']
  name?: T['name']
  file?: ResolverFile
} & ThisType<T>

/** One resolver or patch, or a list of them merged left to right. */
export type ResolverInput<T extends Resolver = Resolver> = ResolverPatch<T> | T | ReadonlyArray<ResolverPatch<T> | T>

/** Brand for a resolver's build options. `Symbol.for` gives one key across copies of `@kubb/kit`, so `Resolver.merge` needs no `instanceof`. */
export const resolverOptions: unique symbol = Symbol.for('@kubb/core/resolver/options')
