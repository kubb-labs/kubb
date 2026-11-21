import type { FileNode, OperationNode, SchemaNode } from '@kubb/ast'
import { Diagnostics, type Filter, type Group, type KubbContext, type Output, type Override, type PluginName, useKubb } from '@kubb/core'
import type { Resolver } from './resolver/Resolver.ts'
import type { PrinterContext } from './types.ts'

/** What `file` reads from a generator or printer factory context. */
export type FileContext = Pick<PrinterContext, 'config' | 'meta' | 'memo' | 'schemas' | 'root' | 'resolver' | 'options' | 'getResolver' | 'requirePlugin'>

export type FileOptions = {
  /** Name before the resolver casts it. @default the schema's `name`, or the operation's `operationId` */
  name?: string
  /** Another plugin whose resolver, `output` and `group` to use, such as `'plugin-ts'` for its types. */
  plugin?: PluginName
  /** @default '.ts' */
  extname?: FileNode['extname']
  /**
   * Adds `Operation` to an operation's name while its file matches a schema file. Set to `false` to keep the name as is.
   * @default true
   */
  suffix?: boolean
}

/** The `<File>` props for one generated file: its location plus the banner and footer from the resolver. */
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

function toLocation(ctx: FileContext, node: SchemaNode | OperationNode, plugin: PluginName | undefined): { resolver: Resolver; location: Location } {
  if (!plugin) {
    const own = ctx.options as LocationOptions
    return { resolver: ctx.resolver, location: { root: ctx.root, output: own.output, group: own.group ?? undefined } }
  }

  const resolver = ctx.getResolver(plugin)
  const base = ctx.requirePlugin(plugin).options as LocationOptions
  // The target plugin's generators see its options after its override rules, so its files follow them too.
  const options = resolver.default.options(node, { options: base, exclude: base.exclude, include: base.include, override: base.override }) ?? base
  return { resolver, location: { root: ctx.root, output: options.output, group: options.group ?? undefined } }
}

/** An operation's file, with an `Operation` suffix while it matches a schema file in the same location, ignoring case. */
function operationFile(
  ctx: FileContext,
  node: OperationNode,
  resolver: Resolver,
  location: Location,
  { name, extname, suffix }: { name: string; extname: FileNode['extname']; suffix: boolean },
): FileNode {
  const entry = (fileName: string) => ({ name: fileName, extname, tag: node.tags[0] ?? 'default', path: node.path, ...location })
  let file = resolver.file(entry(name))
  if (!suffix) return file

  const { output, group } = location
  const schemaPaths = ctx.memo(
    `${resolver.pluginName}:file:schemaPaths:${extname}:${output.mode ?? ''}:${output.path}:${group?.type ?? ''}`,
    () => new Set(ctx.schemas.flatMap((schema) => (schema.name ? [resolver.file({ name: schema.name, extname, ...location }).path.toLowerCase()] : []))),
  )

  for (let next = `${name}Operation`; schemaPaths.has(file.path.toLowerCase()); next += 'Operation') {
    const candidate = resolver.file(entry(next))
    // A single-file output holds every declaration on purpose, so a new name changes nothing.
    if (candidate.path === file.path) break
    file = candidate
  }

  return file
}

/** `file` for an explicit context. Generators get it as `ctx.file`. */
export function resolveFile(ctx: FileContext, node: SchemaNode | OperationNode, options: FileOptions = {}): FileTarget {
  const { extname = '.ts', suffix = true } = options
  const { resolver, location } = toLocation(ctx, node, options.plugin)
  const name = options.name ?? (node.kind === 'Operation' ? node.operationId : node.name)
  if (!name) {
    throw new Diagnostics.Error({
      code: Diagnostics.code.pluginFailed,
      severity: 'error',
      plugin: resolver.pluginName,
      message: '`file()` needs a named schema or a `name` option.',
      help: 'Pass `name` for an inline schema, such as `file(node, { name: "petBody" })`.',
    })
  }

  const resolved =
    node.kind === 'Operation' ? operationFile(ctx, node, resolver, location, { name, extname, suffix }) : resolver.file({ name, extname, ...location })
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
  const ctx = useKubb<KubbContext>()
  // Generator and printer factory contexts are the ones with a resolver.
  if (!('resolver' in ctx)) {
    throw new Diagnostics.Error({
      code: Diagnostics.code.noContext,
      severity: 'error',
      plugin: ctx.plugin.name,
      message: '`file()` runs only in a generator or a printer factory.',
      help: 'Call `file()` inside a generator method, or use `ctx.file()` there.',
    })
  }
  return resolveFile(ctx as unknown as FileContext, node, options)
}
