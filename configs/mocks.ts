import path, { resolve } from 'node:path'
import { type createReactFabric, FileProcessor } from '@kubb/react-fabric'
import { typescriptParser } from '@kubb/react-fabric/parsers'
import type { Fabric as FabricType } from '@kubb/react-fabric/types'
import type { Options } from 'prettier'
import { format as prettierFormat } from 'prettier'
import pluginTypescript from 'prettier/plugins/typescript'
import { expect } from 'vitest'
import { camelCase, pascalCase } from '../internals/utils/src/index.ts'
import { transform } from '../packages/ast/src/index.ts'
import type { OperationNode, SchemaNode, Visitor } from '../packages/ast/src/types.ts'
import type {
  Adapter,
  AdapterFactoryOptions,
  Generator,
  GeneratorContext,
  Plugin,
  PluginDriver,
  PluginFactoryOptions,
  ResolveNameParams,
  ResolvePathParams,
} from '../packages/core/src'
import { getMode } from '../packages/core/src'
import { applyHookResult } from '../packages/core/src/renderNode'

const formatOptions: Options = {
  tabWidth: 2,
  printWidth: 160,
  parser: 'typescript',
  singleQuote: true,
  semi: false,
  bracketSameLine: false,
  endOfLine: 'auto',
  plugins: [pluginTypescript],
}

export async function format(source?: string): Promise<string> {
  if (!source) return ''
  try {
    return prettierFormat(source, formatOptions)
  } catch {
    return source
  }
}

export const createMockedPluginDriver = (options: { name?: string; plugin?: Plugin<any>; config?: PluginDriver['config'] } = {}) =>
  ({
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
      options,
    }: {
      name: string
      extname: `.${string}`
      pluginName: string
      options?: { group?: { tag?: string; path?: string } }
    }) => {
      const baseName = `${name}${extname}`
      // Mirror plugin-ts resolvePath: for tag groups use the tag directly; for path groups
      // take the first non-empty segment (strips leading '/') to avoid absolute-looking paths.
      const groupDir = options?.group?.tag ?? options?.group?.path?.split('/').filter(Boolean)[0]
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
  }) as unknown as PluginDriver

export const mockedPluginDriver = createMockedPluginDriver()

/**
 * Creates a minimal `Adapter` mock suitable for unit tests.
 *
 * - `parse` returns an empty `RootNode` by default; override via `options.parse`.
 * - `getImports` returns `[]` by default (single-file mode, no cross-file imports).
 */
export function createMockedAdapter<TOptions extends AdapterFactoryOptions = AdapterFactoryOptions>(
  options: {
    name?: TOptions['name']
    resolvedOptions?: TOptions['resolvedOptions']
    rootNode?: Adapter<TOptions>['rootNode']
    parse?: Adapter<TOptions>['parse']
    getImports?: Adapter<TOptions>['getImports']
  } = {},
): Adapter<TOptions> {
  return {
    name: (options.name ?? 'oas') as TOptions['name'],
    options: (options.resolvedOptions ?? {}) as TOptions['resolvedOptions'],
    rootNode: options.rootNode ?? null,
    parse: options.parse ?? (async () => ({ kind: 'Root' as const, schemas: [], operations: [] })),
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
  pre?: Array<string>
  post?: Array<string>
}): Plugin<TOptions> {
  return {
    name: params.name,
    options: params.options,
    resolver: params.resolver,
    transformer: params.transformer,
    pre: params.pre,
    post: params.post,
    install: () => {},
    inject: () => undefined as TOptions['context'],
  } as unknown as Plugin<TOptions>
}

export async function matchFiles(files: FabricType['files'] | undefined, pre?: string) {
  if (!files?.length) return

  const fileProcessor = new FileProcessor()
  const parsers = new Map<`.${string}`, any>()
  parsers.set('.ts', typescriptParser)

  const processed = new Map<string, string>()

  for (const file of files) {
    if (!file?.path) {
      continue
    }

    if (processed.has(file.path)) {
      continue
    }

    const parsed = await fileProcessor.parse(file, { parsers })
    const code = file.baseName.endsWith('.json') ? parsed : await format(parsed)

    processed.set(file.path, code)

    const snapshotPath = path.join('__snapshots__', ...(pre ? [camelCase(pre)] : []), file.baseName)
    await expect(code).toMatchFileSnapshot(snapshotPath)
  }

  return processed
}

type RenderGeneratorOptions<TOptions extends PluginFactoryOptions> = {
  config: PluginDriver['config']
  fabric: FabricType
  adapter: Adapter
  driver: PluginDriver
  plugin: Plugin<TOptions>
  options: TOptions['resolvedOptions']
  resolver: TOptions['resolver']
}

function createMockedPluginContext<TOptions extends PluginFactoryOptions>(opts: RenderGeneratorOptions<TOptions>): GeneratorContext<TOptions> {
  const fabric = opts.fabric as ReturnType<typeof createReactFabric>
  const root = resolve(opts.config.root, opts.config.output.path)

  return {
    config: opts.config,
    root,
    getMode: (output: { path: string }) => getMode(resolve(root, output.path)),
    adapter: opts.adapter,
    resolver: opts.resolver,
    plugin: opts.plugin,
    driver: opts.driver,
    rootNode: { kind: 'Root', schemas: [], operations: [] },
    fabric,
    upsertFile: (...files: Parameters<FabricType['upsertFile']>) => fabric.upsertFile(...files),
    warn: (msg: string) => console.warn(msg),
    error: (msg: string) => console.error(msg),
    info: (msg: string) => console.info(msg),
    openInStudio: async () => {},
  } as unknown as GeneratorContext<TOptions>
}

/**
 * Renders a generator's `schema` method in a test context.
 *
 * Replaces the old `renderSchema(node, { ..., Component: generator.Schema })` API.
 *
 * @example
 * await renderGeneratorSchema(typeGenerator, node, { config, fabric, adapter, driver, plugin, options, resolver })
 * await matchFiles(fabric.files)
 */
export async function renderGeneratorSchema<TOptions extends PluginFactoryOptions>(
  generator: Generator<TOptions>,
  node: SchemaNode,
  opts: RenderGeneratorOptions<TOptions>,
): Promise<void> {
  if (!generator.schema) return
  const context = createMockedPluginContext(opts)
  const transformedNode = opts.plugin.transformer ? transform(node, opts.plugin.transformer) : node
  const result = await generator.schema.call(context, transformedNode, opts.options)
  await applyHookResult(result, opts.fabric)
}

/**
 * Renders a generator's `operation` method in a test context.
 *
 * Replaces the old `renderOperation(node, { ..., Component: generator.Operation })` API.
 *
 * @example
 * await renderGeneratorOperation(typeGenerator, node, { config, fabric, adapter, driver, plugin, options, resolver })
 * await matchFiles(fabric.files)
 */
export async function renderGeneratorOperation<TOptions extends PluginFactoryOptions>(
  generator: Generator<TOptions>,
  node: OperationNode,
  opts: RenderGeneratorOptions<TOptions>,
): Promise<void> {
  if (!generator.operation) return
  const context = createMockedPluginContext(opts)
  const transformedNode = opts.plugin.transformer ? transform(node, opts.plugin.transformer) : node
  const result = await generator.operation.call(context, transformedNode, opts.options)
  await applyHookResult(result, opts.fabric)
}

/**
 * Renders a generator's `operations` method in a test context.
 *
 * Replaces the old `renderOperations(nodes, { ..., Component: generator.Operations })` API.
 *
 * @example
 * await renderGeneratorOperations(classClientGenerator, nodes, { config, fabric, adapter, driver, plugin, options, resolver })
 * await matchFiles(fabric.files)
 */
export async function renderGeneratorOperations<TOptions extends PluginFactoryOptions>(
  generator: Generator<TOptions>,
  nodes: Array<OperationNode>,
  opts: RenderGeneratorOptions<TOptions>,
): Promise<void> {
  if (!generator.operations) return
  const context = createMockedPluginContext(opts)
  const transformedNodes = opts.plugin.transformer ? nodes.map((n) => transform(n, opts.plugin.transformer!)) : nodes
  const result = await generator.operations.call(context, transformedNodes, opts.options)
  await applyHookResult(result, opts.fabric)
}
