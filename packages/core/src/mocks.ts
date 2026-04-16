import { resolve } from 'node:path'
import type { FileNode, OperationNode, SchemaNode, Visitor } from '@kubb/ast'
import { transform } from '@kubb/ast'
import { FileManager } from './FileManager.ts'
import { getMode, type PluginDriver } from './PluginDriver.ts'
import { applyHookResult } from './renderNode.ts'
import type {
  Adapter,
  AdapterFactoryOptions,
  Config,
  Generator,
  GeneratorContext,
  Plugin,
  PluginFactoryOptions,
  ResolveNameParams,
  ResolvePathParams,
} from './types.ts'

function toCamelOrPascal(text: string, pascal: boolean): string {
  const normalized = text
    .trim()
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/(\d)([a-z])/g, '$1 $2')

  const words = normalized.split(/[\s\-_./\\:]+/).filter(Boolean)

  return words
    .map((word, i) => {
      const allUpper = word.length > 1 && word === word.toUpperCase()
      if (allUpper) return word
      if (i === 0 && !pascal) return word.charAt(0).toLowerCase() + word.slice(1)
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join('')
    .replace(/[^a-zA-Z0-9]/g, '')
}

function camelCase(text: string): string {
  return toCamelOrPascal(text, false)
}

function pascalCase(text: string): string {
  return toCamelOrPascal(text, true)
}

/**
 * Creates a minimal `PluginDriver` mock suitable for unit tests.
 */
export function createMockedPluginDriver(options: { name?: string; plugin?: Plugin<any>; config?: Config } = {}): PluginDriver {
  return {
    resolveName: (result: ResolveNameParams) => {
      if (result.type === 'file') {
        return camelCase(options?.name || result.name)
      }

      if (result.type === 'type') {
        return pascalCase(result.name)
      }

      if (result.type === 'function') {
        return camelCase(result.name)
      }

      return camelCase(result.name)
    },
    config: options?.config ?? {
      root: '.',
      output: {
        path: './path',
      },
    },
    resolvePath: ({ baseName }: ResolvePathParams) => baseName,
    getFile: ({
      name,
      extname,
      pluginName,
      options: fileOptions,
    }: {
      name: string
      extname: `.${string}`
      pluginName: string
      options?: { group?: { tag?: string; path?: string } }
    }) => {
      const baseName = `${name}${extname}`
      const groupDir = fileOptions?.group?.tag ?? fileOptions?.group?.path?.split('/').filter(Boolean)[0]
      const filePath = groupDir ? `${groupDir}/${baseName}` : baseName

      return {
        path: filePath,
        baseName,
        meta: { pluginName },
      }
    },
    getPlugin(_pluginName: Plugin['name']): Plugin | undefined {
      return options?.plugin
    },
    fileManager: new FileManager(),
  } as unknown as PluginDriver
}

/**
 * Creates a minimal `Adapter` mock suitable for unit tests.
 *
 * - `parse` returns an empty `InputNode` by default; override via `options.parse`.
 * - `getImports` returns `[]` by default (single-file mode, no cross-file imports).
 */
export function createMockedAdapter<TOptions extends AdapterFactoryOptions = AdapterFactoryOptions>(
  options: {
    name?: TOptions['name']
    resolvedOptions?: TOptions['resolvedOptions']
    inputNode?: Adapter<TOptions>['inputNode']
    parse?: Adapter<TOptions>['parse']
    getImports?: Adapter<TOptions>['getImports']
  } = {},
): Adapter<TOptions> {
  return {
    name: (options.name ?? 'oas') as TOptions['name'],
    options: (options.resolvedOptions ?? {}) as TOptions['resolvedOptions'],
    inputNode: options.inputNode ?? null,
    parse: options.parse ?? (async () => ({ kind: 'Input' as const, schemas: [], operations: [] })),
    getImports: options.getImports ?? ((_node: SchemaNode, _resolve: (schemaName: string) => { name: string; path: string }) => []),
  } as Adapter<TOptions>
}

/**
 * Creates a minimal `Plugin` mock suitable for unit tests.
 *
 * @example
 * const plugin = createMockedPlugin<PluginTs>({ name: '@kubb/plugin-ts', options })
 */
export function createMockedPlugin<TOptions extends PluginFactoryOptions = PluginFactoryOptions>(params: {
  name: TOptions['name']
  options: TOptions['resolvedOptions']
  resolver?: TOptions['resolver']
  transformer?: Visitor
  dependencies?: Array<string>
}): Plugin<TOptions> {
  return {
    name: params.name,
    options: params.options,
    resolver: params.resolver,
    transformer: params.transformer,
    dependencies: params.dependencies,
    install: () => {},
    inject: () => undefined as TOptions['context'],
  } as unknown as Plugin<TOptions>
}

type RenderGeneratorOptions<TOptions extends PluginFactoryOptions> = {
  config: Config
  adapter: Adapter
  driver: PluginDriver
  plugin: Plugin<TOptions>
  options: TOptions['resolvedOptions']
  resolver: TOptions['resolver']
}

function createMockedPluginContext<TOptions extends PluginFactoryOptions>(opts: RenderGeneratorOptions<TOptions>): Omit<GeneratorContext<TOptions>, 'options'> {
  const root = resolve(opts.config.root, opts.config.output.path)

  return {
    config: opts.config,
    root,
    getMode: (output: { path: string }) => getMode(resolve(root, output.path)),
    adapter: opts.adapter,
    resolver: opts.resolver,
    plugin: opts.plugin,
    driver: opts.driver,
    inputNode: { kind: 'Input', schemas: [], operations: [] },
    upsertFile: async (...files: Array<FileNode>) => opts.driver.fileManager.upsert(...files),
    warn: (msg: string) => console.warn(msg),
    error: (msg: string) => console.error(msg),
    info: (msg: string) => console.info(msg),
    openInStudio: async () => {},
  } as unknown as Omit<GeneratorContext<TOptions>, 'options'>
}

/**
 * Renders a generator's `schema` method in a test context.
 *
 * @example
 * await renderGeneratorSchema(typeGenerator, node, { config, adapter, driver, plugin, options, resolver })
 * await matchFiles(driver.fileManager.files)
 */
export async function renderGeneratorSchema<TOptions extends PluginFactoryOptions>(
  generator: Generator<TOptions>,
  node: SchemaNode,
  opts: RenderGeneratorOptions<TOptions>,
): Promise<void> {
  if (!generator.schema) return
  const context = createMockedPluginContext(opts)
  const transformedNode = opts.plugin.transformer ? transform(node, opts.plugin.transformer) : node
  const result = await generator.schema(transformedNode, { ...context, options: opts.options })
  await applyHookResult(result, opts.driver, generator.renderer ?? undefined)
}

/**
 * Renders a generator's `operation` method in a test context.
 *
 * @example
 * await renderGeneratorOperation(typeGenerator, node, { config, adapter, driver, plugin, options, resolver })
 * await matchFiles(driver.fileManager.files)
 */
export async function renderGeneratorOperation<TOptions extends PluginFactoryOptions>(
  generator: Generator<TOptions>,
  node: OperationNode,
  opts: RenderGeneratorOptions<TOptions>,
): Promise<void> {
  if (!generator.operation) return
  const context = createMockedPluginContext(opts)
  const transformedNode = opts.plugin.transformer ? transform(node, opts.plugin.transformer) : node
  const result = await generator.operation(transformedNode, { ...context, options: opts.options })
  await applyHookResult(result, opts.driver, generator.renderer ?? undefined)
}

/**
 * Renders a generator's `operations` method in a test context.
 *
 * @example
 * await renderGeneratorOperations(classClientGenerator, nodes, { config, adapter, driver, plugin, options, resolver })
 * await matchFiles(driver.fileManager.files)
 */
export async function renderGeneratorOperations<TOptions extends PluginFactoryOptions>(
  generator: Generator<TOptions>,
  nodes: Array<OperationNode>,
  opts: RenderGeneratorOptions<TOptions>,
): Promise<void> {
  if (!generator.operations) return
  const context = createMockedPluginContext(opts)
  const transformedNodes = opts.plugin.transformer ? nodes.map((n) => transform(n, opts.plugin.transformer!)) : nodes
  const result = await generator.operations(transformedNodes, { ...context, options: opts.options })
  await applyHookResult(result, opts.driver, generator.renderer ?? undefined)
}
