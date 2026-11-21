import path from 'node:path'
import { camelCase, memo } from '@internals/utils'
import { ast, type FileNode, type ImportNode, type InputMeta, type OperationNode, type SchemaNode } from '@kubb/ast'
import { type BannerMeta, type Config, Diagnostics, getInputKind, type Group, type MemoKey, type MemoValue, type Output } from '@kubb/core'
import {
  type ResolveBannerContext,
  type ResolveBannerFile,
  type ResolveFileOptions,
  type ResolveImportsOptions,
  type ResolveNameOptions,
  type ResolvePathOptions,
  type ResolverBuildOptions,
  type ResolverDefault,
  type ResolverFileParams,
  type ResolverFilePathParams,
  type ResolverPatch,
  resolverOptions,
} from './types.ts'
import { resolveOptions } from './resolveOptions.ts'

/** Types a reusable resolver part, such as one namespace or a `file` rule, with `this` as the full resolver. */
export function defineResolver<const T extends object>(part: T & ThisType<Resolver & T>): T {
  return part
}

function isNamespace(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** One segment of an array `resolveName` key, so a repeated key finds its name without building a string. */
type NameNode = { name?: string; next: Map<string | undefined, NameNode> }

const createNameNode = (): NameNode => ({ next: new Map() })

/** Builds a nested file path from a dotted name. */
export function toFilePath(name: string, caseLast: (part: string) => string = camelCase): string {
  const parts = name.split(/\.(?=[a-zA-Z])/)
  return parts
    .map((part, index) => (index === parts.length - 1 ? caseLast(part) : camelCase(part)))
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

/** Built-in `file.baseName`: casts the identifier with `toFilePath` and appends the extension. */
function toBaseName({ name, extname }: Pick<ResolverFileParams, 'name' | 'extname'>): FileNode['baseName'] {
  return `${toFilePath(name)}${extname}` as FileNode['baseName']
}

/** Base constraint for all plugin resolver objects. */
export class Resolver {
  readonly pluginName: string
  /** The built-in machinery, untouched by `name`/`file` overrides and built once since the driver reads it per node. */
  readonly default: ResolverDefault
  readonly isTypeOnly: boolean
  /** How this plugin names a node's file, from `options.file.name`, so readers in other plugins find the same file. */
  readonly fileName: (node: SchemaNode | OperationNode, exportName?: string) => string | undefined
  #options: ResolverBuildOptions
  #memo = memo.create<string, unknown>()
  #usedNames = new Set<string>()
  #stringNames = memo.create<string, string>()
  #arrayNames = createNameNode()
  #fileNames = { used: new Set<string>(), strings: memo.create<string, string>(), arrays: createNameNode() }
  #outputDirs = memo.create<Output, Map<string, string>>({ weak: true })
  #importPaths = memo.create<Output, Map<string, Map<string, Map<string, string>>>>({ weak: true })
  #tagParents = new Map<string, string>()
  // Base-name builder from `options.file.baseName`, bound to the resolver so it can reach `this`.
  // Defaults to `toBaseName` when a resolver sets no `file.baseName`.
  #baseName: (params: Pick<ResolverFileParams, 'name' | 'extname'>) => FileNode['baseName']
  // Full-path override from `options.file.path`, bound to the resolver. Absent by default, in which
  // case the built-in `output.path`/`group` layout is used.
  #filePath: ((params: ResolverFilePathParams) => string) | undefined

  constructor(options: ResolverBuildOptions) {
    this.pluginName = options.pluginName
    this.isTypeOnly = options.isTypeOnly ?? false
    this.#options = options
    this.#baseName = options.file?.baseName ? options.file.baseName.bind(this) : toBaseName
    this.#filePath = options.file?.path ? options.file.path.bind(this) : undefined
    const fileName = options.file?.name
    this.fileName = (node, exportName) => fileName?.call(this, node, exportName)
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

  /** Returns what `compute` produced the first time this build asked for `key`. */
  memo<TKey extends MemoKey, TValue extends MemoValue<TKey>>(key: TKey, compute: () => TValue): TValue {
    return memo(this.#memo, key, compute) as TValue
  }

  /** Reserves emitted identifiers before allocating other declarations. */
  reserveNames(names: Iterable<string>): void {
    for (const name of names) this.#usedNames.add(name)
  }

  setTags(tags: InputMeta['tags']): void {
    this.#tagParents.clear()
    for (const { name, parent } of tags ?? []) if (parent) this.#tagParents.set(name, parent)
  }

  /** Returns the same name for repeated declaration keys. */
  resolveName({ key, name, normalize = (name: string) => name, scope = 'name' }: ResolveNameOptions): string {
    const store = scope === 'file' ? this.#fileNames : { used: this.#usedNames, strings: this.#stringNames, arrays: this.#arrayNames }
    if (typeof key === 'string') return memo(store.strings, key, () => this.#allocateName({ name, normalize, used: store.used, suffix: 1 }))

    const node = key.reduce((parent, segment) => memo(parent.next, segment, createNameNode), store.arrays)
    node.name ??= this.#allocateName({ name, normalize, used: store.used, suffix: 1 })
    return node.name
  }

  #allocateName({ name, normalize, used, suffix }: Required<Pick<ResolveNameOptions, 'name' | 'normalize'>> & { used: Set<string>; suffix: number }): string {
    const candidate = suffix === 1 ? name : `${name}${suffix}`
    const normalized = normalize(candidate)
    const names = typeof normalized === 'string' ? [normalized] : normalized
    if (names.some((emittedName) => used.has(emittedName))) return this.#allocateName({ name, normalize, used, suffix: suffix + 1 })
    for (const emittedName of names) used.add(emittedName)
    return candidate
  }

  file(options: ResolveFileOptions): FileNode {
    return this.#resolveFile(options)
  }

  /** Builds one `ImportNode` per unique schema referenced in the tree, in first-occurrence order. */
  imports(options: ResolveImportsOptions): Array<ImportNode> {
    const { node, root, output, extname = '.ts', name, checks } = options
    const resolveName = name ?? ((schemaName: string) => this.name(schemaName))
    // A schema import has no `tag` or `path`, so `group` never moves it and stays out of the key.
    const byRoot = memo(this.#importPaths, output, () => new Map<string, Map<string, Map<string, string>>>())
    const byExtname = memo(byRoot, root, () => new Map<string, Map<string, string>>())
    const paths = memo(byExtname, extname, () => new Map<string, string>())

    return ast.graph.getImportedNames(node, { checks }).map((schemaName) =>
      ast.factory.createImport({
        name: [resolveName(schemaName)],
        path: memo(paths, schemaName, () => this.#resolveFilePath({ name: schemaName, extname, root, output })),
      }),
    )
  }

  /** Folds each `override` over `base`, left to right, and returns a new resolver with helpers re-bound. */
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

  /** Binds each entry of `options` onto the resolver, so `this.name`, `this.default`, and `this.file` resolve there for top-level helpers and namespace methods alike. */
  #apply(options: ResolverBuildOptions): void {
    const root = this as Resolver & Record<string, unknown>
    const bind = (value: unknown) => (typeof value === 'function' ? value.bind(root) : value)

    for (const [key, value] of Object.entries(options)) {
      // `file` drives file naming through `#baseName`, not a top-level method, so it must not be
      // assigned here (it would shadow the `file` method with a plain `{ name }` object).
      if (key === 'pluginName' || key === 'default' || key === 'file' || key === 'shared' || key === 'isTypeOnly' || value === undefined) continue
      root[key] = isNamespace(value) ? Object.fromEntries(Object.entries(value).map(([method, member]) => [method, bind(member)])) : bind(value)
    }
  }

  /** The folder a group puts a file in, relative to the output directory. */
  groupDir(group: Group, groupValue: string): string {
    if (group.name) return group.name({ group: groupValue })
    if (group.type === 'tag') {
      const chain = [groupValue]
      // A `parent` loop stops at the first tag seen twice.
      for (let parent = this.#tagParents.get(groupValue); parent && !chain.includes(parent); parent = this.#tagParents.get(parent)) chain.unshift(parent)
      return path.join(...chain.map((tag) => camelCase(tag)))
    }
    const segment = groupValue.split('/').filter((part) => part !== '' && part !== '.' && part !== '..')[0]
    return segment ? camelCase(segment) : ''
  }

  /** `mode: 'file'` (default) resolves directly to `output.path`. */
  #resolvePath({ baseName, tag, path: groupPath, root, output, group }: ResolvePathOptions): string {
    const outputDir = memo(
      memo(this.#outputDirs, output, () => new Map<string, string>()),
      root,
      () => path.resolve(root, output.path),
    )
    if (output.mode !== 'directory') {
      return outputDir
    }

    // A file without the value its group needs (an SDK class per tag, grouped by path) is not grouped.
    const groupValue = group?.type === 'path' ? groupPath : tag
    const result = group && groupValue ? path.resolve(outputDir, this.groupDir(group, groupValue), baseName) : path.resolve(outputDir, baseName)

    assertInside({
      target: result,
      parent: outputDir,
      message: `Resolved path "${result}" is outside the output directory "${outputDir}".`,
      help: 'This can stem from a path traversal in the OpenAPI specification or a misconfigured `group.name` function. Keep generated paths within the output directory.',
    })

    return result
  }

  /** Resolves a resolver-supplied full path (`file.path`) against `root`, bypassing `output.path` and `group`. */
  #resolveOverridePath(filePath: string, root: string): string {
    const resolved = path.resolve(root, filePath)
    assertInside({
      target: resolved,
      parent: root,
      message: `Resolved path "${resolved}" is outside the output directory "${root}".`,
      help: 'A resolver `file.path` must return a path inside the output directory (`config.output.path`).',
    })

    return resolved
  }

  /** The absolute path `#resolveFile` places a file at. */
  #resolveFilePath({ name, extname, tag, path: groupPath, root: outputRoot, output, group }: ResolveFileOptions): string {
    // A shared schema's file and every import of it move under `shared.path`. Operation files carry a `tag` or `path`, so they stay.
    // A file-mode plugin or a custom `file.path` writes outside the plugin layout, so it shares none.
    const shared = this.#options.shared
    const root = shared && output.mode === 'directory' && !this.#filePath && !tag && !groupPath && shared.schemas.includes(name) ? shared.path : outputRoot
    const baseName = this.#baseName({ name, extname })
    return this.#filePath
      ? this.#resolveOverridePath(this.#filePath({ baseName, output }), root)
      : this.#resolvePath({ baseName, tag, path: groupPath, root, output, group })
  }

  /** Builds a `FileNode`. */
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

  /** Missing fields default to empty or `false` so the `BannerMeta` shape stays stable, even when a caller such as the barrel plugin has no document metadata. */
  static #buildBannerMeta(meta: InputMeta | undefined, file: ResolveBannerFile | undefined): BannerMeta {
    return {
      title: meta?.title,
      description: meta?.description,
      version: meta?.version,
      baseURL: meta?.baseURL,
      filePath: file?.path ?? '',
      baseName: file?.baseName ?? '',
      isBarrel: file?.isBarrel ?? false,
      isAggregation: file?.isAggregation ?? false,
    }
  }

  /** Resolves a user-configured banner/footer value. */
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

  /** A user-supplied `output.banner` overrides the default Kubb notice. */
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
