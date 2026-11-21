import type { FileNode, OperationNode, SchemaNode } from '@kubb/ast'
import { Diagnostics, type Filter, type Group, type KubbContext, type Output, type Override, type PluginName, useKubb } from '@kubb/core'
import type { Resolver } from './resolver/Resolver.ts'
import { slot } from './composables.ts'
import type { Generator, PrinterContext } from './types.ts'

export type FileContext = Pick<
  PrinterContext,
  'config' | 'meta' | 'memo' | 'schemas' | 'root' | 'resolver' | 'options' | 'getResolver' | 'requirePlugin' | 'plugin'
>

export type FileOptions = {
  /**
   * The name before the resolver applies its casing.
   *
   * @default the resolver's `file.name`, else the schema's `name` or the operation's `operationId`
   */
  name?: string
  /**
   * Another plugin whose resolver, `output` and `group` to use, such as `'plugin-ts'` for its types.
   */
  plugin?: PluginName
  /**
   * The file extension.
   *
   * @default '.ts'
   */
  extname?: FileNode['extname']
  /**
   * Adds `Operation` to an operation's name while its file matches a schema file. Set to `false` to keep the name as is.
   *
   * @default `true` when the plugin has a schema generator or no generators
   */
  suffix?: boolean
}

/**
 * The `<File>` props for one generated file: its location plus the banner and footer from the resolver.
 */
export type FileTarget = Pick<FileNode, 'baseName' | 'path' | 'meta'> & {
  banner: string | null
  footer: string | null
}

type Location = { root: string; output: Output; group: Group | undefined }

/**
 * A file that no single node owns, such as a file that lists every operation. `tag` and `path` place it in a `group` folder.
 */
export type NamedFile = { name: string; tag?: string; path?: string }

/** What `file()` locates: a schema node, an operation node, or a named file. */
export type FileSource = SchemaNode | OperationNode | NamedFile

const isNode = (source: FileSource): source is SchemaNode | OperationNode => 'kind' in source

type LocationOptions = {
  output: Output
  group?: Group | null
  exclude?: Array<Filter>
  include?: Array<Filter>
  override?: Array<Override<LocationOptions>>
}

/**
 * A plugin's options for `node` after its `include`, `exclude` and `override` rules, or `null` when the rules leave `node` out.
 */
export function pluginOptionsFor(ctx: FileContext, node: SchemaNode | OperationNode, plugin: PluginName): LocationOptions | null {
  const base = ctx.requirePlugin(plugin).options as LocationOptions
  return ctx.getResolver(plugin).default.options(node, { options: base, exclude: base.exclude, include: base.include, override: base.override })
}

function toLocation(
  ctx: FileContext,
  node: FileSource,
  plugin: PluginName | undefined,
  pluginOptions?: LocationOptions,
): { resolver: Resolver; location: Location } {
  if (!plugin) {
    const own = ctx.options as LocationOptions
    return { resolver: ctx.resolver, location: { root: ctx.root, output: own.output, group: own.group ?? undefined } }
  }

  // The target plugin's generators see its options after its override rules, so its files follow them too.
  const base = ctx.requirePlugin(plugin).options as LocationOptions
  const { output, group } = pluginOptions ?? (isNode(node) ? pluginOptionsFor(ctx, node, plugin) : null) ?? base
  return { resolver: ctx.getResolver(plugin), location: { root: ctx.root, output, group: group ?? undefined } }
}

/**
 * An operation's file, with an `Operation` suffix while it matches a schema file in the same location, ignoring case.
 */
function operationFile(
  ctx: FileContext,
  node: OperationNode,
  resolver: Resolver,
  location: Location,
  { name, extname, suffix }: { name: string; extname: FileNode['extname']; suffix: boolean },
): FileNode {
  const entry = (fileName: string) => ({ name: fileName, extname, tag: node.tags[0] ?? 'default', path: node.path, ...location })
  const first = resolver.file(entry(name))
  if (!suffix) return first

  const { output, group } = location
  const schemaPaths = ctx.memo(
    `${resolver.pluginName}:file:schemaPaths:${extname}:${output.mode ?? ''}:${output.path}:${group?.type ?? ''}`,
    () => new Set(ctx.schemas.flatMap((schema) => (schema.name ? [resolver.file({ name: schema.name, extname, ...location }).path.toLowerCase()] : []))),
  )
  const withSuffix = (file: FileNode, nextName: string): FileNode => {
    if (!schemaPaths.has(file.path.toLowerCase())) return file
    const candidate = resolver.file(entry(nextName))
    // A single-file output holds every declaration on purpose, so a new name changes nothing.
    if (candidate.path === file.path) return file
    return withSuffix(candidate, `${nextName}Operation`)
  }

  return withSuffix(first, `${name}Operation`)
}

// A plugin without schema generators writes no schema file for an operation file to clash with.
function writesSchemaFiles(ctx: FileContext, pluginName: string): boolean {
  const generators = ctx.memo.get(slot.generators(pluginName)) as Array<Generator> | undefined
  return !generators?.length || generators.some((generator) => generator.schema)
}

export function locateFile(
  ctx: FileContext,
  node: FileSource,
  options: FileOptions & { exportName?: string } = {},
  pluginOptions?: LocationOptions,
): { resolver: Resolver; location: Location; file: FileNode } {
  const { extname = '.ts' } = options
  const { resolver, location } = toLocation(ctx, node, options.plugin, pluginOptions)
  if (!isNode(node)) {
    return { resolver, location, file: resolver.file({ name: options.name ?? node.name, extname, tag: node.tag, path: node.path, ...location }) }
  }
  const suffix = options.suffix ?? writesSchemaFiles(ctx, options.plugin ?? ctx.plugin.name)
  const name = options.name ?? resolver.fileName(node, options.exportName) ?? (node.kind === 'Operation' ? node.operationId : node.name)
  if (!name) {
    throw new Diagnostics.Error({
      code: Diagnostics.code.pluginFailed,
      severity: 'error',
      plugin: resolver.pluginName,
      message: '`file()` needs a named schema or a `name` option.',
      help: 'Pass `name` for an inline schema, such as `file(node, { name: "petBody" })`.',
    })
  }

  const file =
    node.kind === 'Operation' ? operationFile(ctx, node, resolver, location, { name, extname, suffix }) : resolver.file({ name, extname, ...location })
  return { resolver, location, file }
}

/**
 * `file` for an explicit context. Generators get it as `ctx.file`.
 */
export function resolveFile(ctx: FileContext, node: FileSource, options: FileOptions = {}): FileTarget {
  const { resolver, location, file: resolved } = locateFile(ctx, node, options)
  const fileContext = { output: location.output, config: ctx.config, file: { path: resolved.path, baseName: resolved.baseName } }

  return {
    baseName: resolved.baseName,
    path: resolved.path,
    meta: resolved.meta,
    banner: resolver.default.banner(ctx.meta, fileContext),
    footer: resolver.default.footer(ctx.meta, fileContext),
  }
}

/**
 * The `<File>` props for the file the current generator writes `node` to, with the banner and footer from the plugin's `output`.
 * The same as `ctx.file(node)` and `this.file(node)`.
 *
 * Pass `{ name }` for a file that no single node owns, such as an index of every operation.
 *
 * @example
 * `<File {...file(node)}>…</File>`
 * `<File {...file({ name: 'handlers' })}>…</File>`
 */
export function file(node: FileSource, options?: FileOptions): FileTarget {
  return resolveFile(useFileContext('file'), node, options)
}

export function useFileContext(name: string): FileContext {
  const ctx = useKubb<KubbContext>()
  if ('resolver' in ctx) return ctx as unknown as FileContext

  throw new Diagnostics.Error({
    code: Diagnostics.code.noContext,
    severity: 'error',
    plugin: ctx.plugin.name,
    message: `\`${name}()\` runs only in a generator or a printer factory.`,
    help: `Call \`${name}()\` inside a generator method or a printer factory.`,
  })
}
