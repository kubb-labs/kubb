import { resolve } from 'node:path'
import type { FileNode, OperationNode, SchemaNode, Visitor } from '@kubb/ast'
import { transform } from '@kubb/ast'
import { FileManager } from './FileManager.ts'
import { PluginDriver } from './PluginDriver.ts'
import { applyHookResult } from './renderNode.ts'
import type {
  Adapter,
  AdapterFactoryOptions,
  Config,
  Generator,
  GeneratorContext,
  NormalizedPlugin,
  PluginFactoryOptions,
  ResolveNameParams,
  ResolvePathParams,
} from './types.ts'

type CaseStyle = 'camel' | 'pascal'

function splitWords(text: string): string[] {
  const normalized = text
    .trim()
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/(\d)([a-z])/g, '$1 $2')

  return normalized.split(/[\s\-_./\\:]+/).filter(Boolean)
}

function toCaseStyle(text: string, style: CaseStyle): string {
  return splitWords(text)
    .map((word, i) => {
      const isAcronym = word.length > 1 && word === word.toUpperCase()
      if (isAcronym) return word

      const shouldLowerFirst = i === 0 && style === 'camel'
      const head = shouldLowerFirst ? word.charAt(0).toLowerCase() : word.charAt(0).toUpperCase()
      return head + word.slice(1)
    })
    .join('')
    .replace(/[^a-zA-Z0-9]/g, '')
}

const camelCase = (text: string): string => toCaseStyle(text, 'camel')
const pascalCase = (text: string): string => toCaseStyle(text, 'pascal')

/**
 * Creates a minimal `PluginDriver` mock suitable for unit tests.
 */
export function createMockedPluginDriver(options: { name?: string; plugin?: NormalizedPlugin; config?: Config } = {}): PluginDriver {
  return {
    resolveName: (result: ResolveNameParams) => {
      if (result.type === 'type') return pascalCase(result.name)
      // `file` lets callers override the source name; all other types reuse the provided one.
      const source = result.type === 'file' ? options?.name || result.name : result.name
      return camelCase(source)
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
    getPlugin(_pluginName: NormalizedPlugin['name']): NormalizedPlugin | undefined {
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
 * Creates a minimal `NormalizedPlugin` mock suitable for unit tests.
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
}): NormalizedPlugin<TOptions> {
  return {
    name: params.name,
    options: params.options,
    resolver: params.resolver,
    transformer: params.transformer,
    dependencies: params.dependencies,
    install: () => {},
    inject: () => undefined as TOptions['context'],
  } as unknown as NormalizedPlugin<TOptions>
}

type RenderGeneratorOptions<TOptions extends PluginFactoryOptions> = {
  config: Config
  adapter: Adapter
  driver: PluginDriver
  plugin: NormalizedPlugin<TOptions>
  options: TOptions['resolvedOptions']
  resolver: TOptions['resolver']
}

function createMockedPluginContext<TOptions extends PluginFactoryOptions>(opts: RenderGeneratorOptions<TOptions>): Omit<GeneratorContext<TOptions>, 'options'> {
  const root = resolve(opts.config.root, opts.config.output.path)

  return {
    config: opts.config,
    root,
    getMode: (output: { path: string }) => PluginDriver.getMode(resolve(root, output.path)),
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
