import path from 'node:path'
import { camelCase } from '@internals/utils'
import type { FileNode } from '@kubb/ast'
import { ast } from '@kubb/ast'
import { expect, vi } from 'vitest'
import type { Parser } from './defineParser.ts'
import { FileManager } from './FileManager.ts'
import { createMemo } from './memo.ts'
import { type KubbDriver, pluginNotFoundError } from './KubbDriver.ts'
import type { Config } from './types.ts'
import type { Adapter, AdapterFactoryOptions } from './createAdapter.ts'
import type { KubbPluginSetupContext, NormalizedPlugin, Plugin, PluginType } from './definePlugin.ts'

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
    memo: createMemo(new Map()),
    fileManager,
  } as unknown as KubbDriver
}

/** Creates a `kubb:plugin:setup` context for unit tests. `requirePlugin` fails for names `plugins` does not list. */
export function createMockedSetupContext<TFactory extends PluginType = PluginType>({
  plugins = [],
  options = {} as TFactory['options'],
}: { plugins?: Array<string>; options?: TFactory['options'] } = {}): KubbPluginSetupContext<TFactory> {
  const registered = plugins.map((name) => ({ name }) as unknown as Plugin)

  return {
    config: { plugins: registered } as unknown as Config,
    options,
    setOptions: vi.fn(),
    injectFile: vi.fn(),
    requirePlugin: vi.fn((pluginName: string) => {
      const plugin = registered.find((entry) => entry.name === pluginName)
      if (!plugin) throw pluginNotFoundError({ pluginName })
      return plugin
    }) as KubbPluginSetupContext<TFactory>['requirePlugin'],
    memo: createMemo(new Map()),
    plugin: { name: 'plugin-mock', meta: { name: 'plugin-mock' } },
  }
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
export function createMockedPlugin<TOptions extends PluginType = PluginType>(params: {
  name: TOptions['name']
  options: TOptions['resolvedOptions']
  dependencies?: Array<string>
}): NormalizedPlugin<TOptions> {
  return {
    name: params.name,
    options: params.options,
    dependencies: params.dependencies,
    hooks: {},
  } as unknown as NormalizedPlugin<TOptions>
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
 *
 * @example
 * ```ts
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
