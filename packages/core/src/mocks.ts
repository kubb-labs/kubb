import path, { resolve } from 'node:path'
import { camelCase } from '@internals/utils'
import type { FileNode, InputMeta, Macro, OperationNode, SchemaNode } from '@kubb/ast'
import { applyMacros, ast } from '@kubb/ast'
import { expect } from 'vitest'
import type { Parser } from './defineParser.ts'
import { FileManager } from './FileManager.ts'
import { Hookable } from './Hookable.ts'
import type { KubbDriver } from './KubbDriver.ts'
import type {
  Adapter,
  AdapterFactoryOptions,
  Config,
  Generator,
  GeneratorContext,
  KubbHooks,
  NormalizedPlugin,
  PluginFactoryOptions,
  RendererFactory,
} from './types.ts'

/**
 * Creates a minimal `KubbDriver` mock for unit tests.
 */
export function createMockedPluginDriver(options: { name?: string; plugin?: NormalizedPlugin; config?: Config } = {}): KubbDriver {
  const fileManager = new FileManager()

  return {
    config: options?.config ?? {
      root: '.',
      output: {
        path: './path',
      },
    },
    getPlugin(_pluginName: string): NormalizedPlugin | undefined {
      return options?.plugin
    },
    getResolver: (_pluginName: string) => options?.plugin?.resolver,
    fileManager,
    async dispatch({ result, renderer }: { result: unknown; renderer?: RendererFactory | null }): Promise<void> {
      if (!result) return

      if (Array.isArray(result)) {
        fileManager.upsert(...(result as Array<FileNode>))
        return
      }

      if (!renderer) return

      using instance = renderer()
      await instance.render(result)
      fileManager.upsert(...instance.files)
    },
  } as unknown as KubbDriver
}

/**
 * Creates a minimal `Adapter` mock for unit tests.
 * `parse` returns an empty `InputNode` by default. Override via `options.parse`.
 */
export function createMockedAdapter<TOptions extends AdapterFactoryOptions = AdapterFactoryOptions>(
  options: {
    name?: TOptions['name']
    resolvedOptions?: TOptions['resolvedOptions']
    parse?: Adapter<TOptions>['parse']
  } = {},
): Adapter<TOptions> {
  const adapter: Adapter<TOptions> = {
    name: (options.name ?? 'oas') as TOptions['name'],
    options: (options.resolvedOptions ?? {}) as TOptions['resolvedOptions'],
    document: null,
    parse: options.parse ?? (async () => ast.factory.createInput()),
    validate: async () => {},
  }
  return adapter
}

/**
 * Creates a minimal plugin mock for unit tests.
 *
 * @example
 * `const plugin = createMockedPlugin<PluginTs>({ name: '@kubb/plugin-ts', options })`
 */
export function createMockedPlugin<TOptions extends PluginFactoryOptions = PluginFactoryOptions>(params: {
  name: TOptions['name']
  options: TOptions['resolvedOptions']
  resolver?: TOptions['resolver']
  macros?: Array<Macro>
  dependencies?: Array<string>
}): NormalizedPlugin<TOptions> {
  return {
    name: params.name,
    options: params.options,
    resolver: params.resolver,
    macros: params.macros,
    dependencies: params.dependencies,
    hooks: {},
  } as unknown as NormalizedPlugin<TOptions>
}

type RenderGeneratorOptions<TOptions extends PluginFactoryOptions> = {
  config: Config
  adapter: Adapter
  meta?: InputMeta
  driver: KubbDriver
  plugin: NormalizedPlugin<TOptions>
  options: TOptions['resolvedOptions']
  resolver: TOptions['resolver']
}

function createMockedPluginContext<TOptions extends PluginFactoryOptions>(opts: RenderGeneratorOptions<TOptions>): Omit<GeneratorContext<TOptions>, 'options'> {
  const root = resolve(opts.config.root, opts.config.output.path)

  return {
    config: opts.config,
    root,
    adapter: opts.adapter,
    resolver: opts.resolver,
    plugin: opts.plugin,
    driver: opts.driver,
    getResolver: (name: string) => opts.driver.getResolver(name),
    meta: opts.meta ?? { circularNames: [], enumNames: [] },
    addFile: async (...files: Array<FileNode>) => opts.driver.fileManager.add(...files),
    upsertFile: async (...files: Array<FileNode>) => opts.driver.fileManager.upsert(...files),
    hooks: opts.driver.hooks ?? new Hookable<KubbHooks>(),
    warn: (msg: string) => console.warn(msg),
    error: (msg: string) => console.error(msg),
    info: (msg: string) => console.info(msg),
  } as unknown as Omit<GeneratorContext<TOptions>, 'options'>
}

/**
 * Renders a generator's `schema` method in a test context.
 *
 * @example
 * ```ts
 * await renderGeneratorSchema(typeGenerator, node, { config, adapter, driver, plugin, options, resolver })
 * await matchFiles(driver.fileManager.files)
 * ```
 */
export async function renderGeneratorSchema<TOptions extends PluginFactoryOptions>(
  generator: Generator<TOptions>,
  node: SchemaNode,
  opts: RenderGeneratorOptions<TOptions>,
): Promise<void> {
  if (!generator.schema) return
  const context = createMockedPluginContext(opts)
  const transformedNode = opts.plugin.macros?.length ? applyMacros(node, opts.plugin.macros) : node
  const result = await generator.schema(transformedNode, {
    ...context,
    options: opts.options,
  })
  await opts.driver.dispatch({ result, renderer: generator.renderer })
}

/**
 * Renders a generator's `operation` method in a test context.
 *
 * @example
 * ```ts
 * await renderGeneratorOperation(typeGenerator, node, { config, adapter, driver, plugin, options, resolver })
 * await matchFiles(driver.fileManager.files)
 * ```
 */
export async function renderGeneratorOperation<TOptions extends PluginFactoryOptions>(
  generator: Generator<TOptions>,
  node: OperationNode,
  opts: RenderGeneratorOptions<TOptions>,
): Promise<void> {
  if (!generator.operation) return
  const context = createMockedPluginContext(opts)
  const transformedNode = opts.plugin.macros?.length ? applyMacros(node, opts.plugin.macros) : node
  const result = await generator.operation(transformedNode, {
    ...context,
    options: opts.options,
  })
  await opts.driver.dispatch({ result, renderer: generator.renderer })
}

/**
 * Renders a generator's `operations` method in a test context.
 *
 * @example
 * ```ts
 * await renderGeneratorOperations(classClientGenerator, nodes, { config, adapter, driver, plugin, options, resolver })
 * await matchFiles(driver.fileManager.files)
 * ```
 */
export async function renderGeneratorOperations<TOptions extends PluginFactoryOptions>(
  generator: Generator<TOptions>,
  nodes: Array<OperationNode>,
  opts: RenderGeneratorOptions<TOptions>,
): Promise<void> {
  if (!generator.operations) return
  const context = createMockedPluginContext(opts)
  const transformedNodes = opts.plugin.macros?.length ? nodes.map((n) => applyMacros(n, opts.plugin.macros!)) : nodes
  const result = await generator.operations(transformedNodes, {
    ...context,
    options: opts.options,
  })
  await opts.driver.dispatch({ result, renderer: generator.renderer })
}

type MatchFilesOptions = {
  /**
   * Parsers indexed by file extension, used to render each `FileNode` to source.
   * Without a matching parser the file's raw content is used.
   */
  parsers?: Map<FileNode['extname'], Parser>
  /**
   * Formatter applied to non-JSON output before snapshotting, e.g. prettier. When
   * omitted the parsed source is snapshotted as-is.
   */
  format?: (source?: string) => string | Promise<string>
  /**
   * Subfolder under `__snapshots__`, camelCased. Useful to keep variant snapshots apart.
   */
  pre?: string
}

/**
 * Renders the driver's collected `FileNode`s to source and asserts each against a file snapshot.
 * Pair it with the `renderGenerator*` helpers to snapshot a generator's output.
 *
 * @example
 * ```ts
 * await renderGeneratorSchema(typeGenerator, node, { config, adapter, driver, plugin, options, resolver })
 * await matchFiles(driver.fileManager.files, { parsers, format })
 * ```
 */
export async function matchFiles(files: Array<FileNode> | undefined, options: MatchFilesOptions = {}): Promise<Map<string, string> | undefined> {
  if (!files?.length) return

  const { parsers = new Map(), format, pre } = options
  const fileManager = new FileManager()
  const processed = new Map<string, string>()

  for (const file of files) {
    if (!file?.path || processed.has(file.path)) {
      continue
    }

    const parsed = await fileManager.parse(file, { parsers })
    const code = file.baseName.endsWith('.json') || !format ? parsed : await format(parsed)

    processed.set(file.path, code)

    const snapshotPath = path.join('__snapshots__', ...(pre ? [camelCase(pre)] : []), file.baseName)
    await expect(code).toMatchFileSnapshot(snapshotPath)
  }

  return processed
}
