import { memo } from '@internals/utils'
import type { FileNode, OperationNode, SchemaNode } from '@kubb/ast'
import { Diagnostics, type Filter, type Group, type KubbContext, type Output, type Override, type PluginName, useKubb } from '@kubb/core'
import type { Resolver } from './resolver/Resolver.ts'
import { type RegisteredTemplate, slot } from './composables.ts'
import type { PrinterContext } from './types.ts'

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
}

/**
 * The `<File>` props for one generated file: its location plus the banner and footer from the resolver.
 */
export type FileTarget = Pick<FileNode, 'baseName' | 'path' | 'meta'> & {
  banner: string | null
  footer: string | null
}

type Location = { root: string; output: Output; group: Group | undefined }

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
export function resolvePluginOptions({
  ctx,
  node,
  plugin,
}: {
  ctx: FileContext
  node: SchemaNode | OperationNode
  plugin: PluginName
}): LocationOptions | null {
  const base = ctx.requirePlugin(plugin).options as LocationOptions
  return ctx.getResolver(plugin).default.options(node, { options: base, exclude: base.exclude, include: base.include, override: base.override })
}

function toLocation({
  ctx,
  node,
  plugin,
  pluginOptions,
  resolver,
}: {
  ctx: FileContext
  node: SchemaNode | OperationNode
  plugin: PluginName | undefined
  pluginOptions?: LocationOptions | null
  resolver?: Resolver
}): { resolver: Resolver; location: Location } {
  if (!plugin) {
    const own = ctx.options as LocationOptions
    return { resolver: ctx.resolver, location: { root: ctx.root, output: own.output, group: own.group ?? undefined } }
  }

  // The target plugin's generators see its options after its override rules, so its files follow them too.
  const { output, group } = pluginOptions ?? resolvePluginOptions({ ctx, node, plugin }) ?? (ctx.requirePlugin(plugin).options as LocationOptions)
  return { resolver: resolver ?? ctx.getResolver(plugin), location: { root: ctx.root, output, group: group ?? undefined } }
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
  const byOutput = ctx.memo(`${resolver.pluginName}:file:schemaPaths:${extname}`, () =>
    memo.create<Output, Map<Group | undefined, Set<string>>>({ weak: true }),
  )
  const schemaPaths = memo(
    memo(byOutput, output, () => new Map()),
    group,
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

// A plugin without schema templates writes no schema file for an operation file to clash with.
function writesSchemaFiles(ctx: FileContext, pluginName: string): boolean {
  const templates = ctx.memo.get(slot.templates(pluginName)) as Array<RegisteredTemplate> | undefined
  return !templates?.length || templates.some((template) => template.kind === 'Schema')
}

/**
 * The file a plugin writes `node` to, with the resolver and location it comes from. `exportName` is the name being imported,
 * which the resolver's `file.name` reads for a plugin that writes several files per node.
 */
export function resolveLocation({
  ctx,
  node,
  options = {},
  pluginOptions,
  resolver: targetResolver,
}: {
  ctx: FileContext
  node: SchemaNode | OperationNode
  options?: FileOptions & { exportName?: string }
  /**
   * The target plugin's options for `node`, when the caller already has them.
   */
  pluginOptions?: LocationOptions | null
  /**
   * The resolver that names the file, such as a provided one, instead of the target plugin's own.
   */
  resolver?: Resolver
}): { resolver: Resolver; location: Location; file: FileNode } {
  const { extname = '.ts' } = options
  const { resolver, location } = toLocation({ ctx, node, plugin: options.plugin, pluginOptions, resolver: targetResolver })
  const suffix = writesSchemaFiles(ctx, options.plugin ?? ctx.plugin.name)
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
export function resolveFile(ctx: FileContext, node: SchemaNode | OperationNode, options: FileOptions = {}): FileTarget {
  const { resolver, location, file: resolved } = resolveLocation({ ctx, node, options })
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
 * @example
 * `<File {...file(node)}>…</File>`
 */
export function file(node: SchemaNode | OperationNode, options?: FileOptions): FileTarget {
  return resolveFile(useFileContext('file'), node, options)
}

/**
 * The current generator or printer context, or a `KUBB_NO_CONTEXT` error that names the calling composable.
 */
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
