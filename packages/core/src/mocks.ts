import { ast } from '@kubb/ast'
import { vi } from 'vitest'
import { createMemo } from './memo.ts'
import { pluginNotFoundError } from './driver.ts'
import type { Config } from './types.ts'
import type { Adapter, AdapterFactoryOptions } from './createAdapter.ts'
import type { KubbPluginSetupContext, NormalizedPlugin, Plugin, PluginType } from './definePlugin.ts'

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
