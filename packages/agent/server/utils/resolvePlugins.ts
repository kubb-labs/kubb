import type { Plugin } from '@kubb/core'
import { pluginClient } from '@kubb/plugin-client'
import { pluginCypress } from '@kubb/plugin-cypress'
import { pluginFaker } from '@kubb/plugin-faker'
import { pluginMcp } from '@kubb/plugin-mcp'
import { pluginMsw } from '@kubb/plugin-msw'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginReactQuery } from '@kubb/plugin-react-query'
import { pluginRedoc } from '@kubb/plugin-redoc'
import { pluginSolidQuery } from '@kubb/plugin-solid-query'
import { pluginSvelteQuery } from '@kubb/plugin-svelte-query'
import { pluginSwr } from '@kubb/plugin-swr'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginVueQuery } from '@kubb/plugin-vue-query'
import { pluginZod } from '@kubb/plugin-zod'
import type { JSONKubbConfig } from '~/types/agent.ts'

type PluginFactory = (options: unknown) => Plugin

const pluginRegistry: Record<string, PluginFactory> = {
  '@kubb/plugin-client': pluginClient as PluginFactory,
  '@kubb/plugin-cypress': pluginCypress as PluginFactory,
  '@kubb/plugin-faker': pluginFaker as PluginFactory,
  '@kubb/plugin-mcp': pluginMcp as PluginFactory,
  '@kubb/plugin-msw': pluginMsw as PluginFactory,
  '@kubb/plugin-oas': pluginOas as PluginFactory,
  '@kubb/plugin-react-query': pluginReactQuery as PluginFactory,
  '@kubb/plugin-redoc': pluginRedoc as PluginFactory,
  '@kubb/plugin-solid-query': pluginSolidQuery as PluginFactory,
  '@kubb/plugin-svelte-query': pluginSvelteQuery as PluginFactory,
  '@kubb/plugin-swr': pluginSwr as PluginFactory,
  '@kubb/plugin-ts': pluginTs as PluginFactory,
  '@kubb/plugin-vue-query': pluginVueQuery as PluginFactory,
  '@kubb/plugin-zod': pluginZod as PluginFactory,
}

/**
 * Resolves each plugin entry by looking up the factory in the static plugin
 * registry and calling it with the provided options.
 *
 * @example
 * // JSONKubbConfig plugin entry
 * { name: '@kubb/plugin-react-query', options: { output: { path: './hooks' } } }
 * // is resolved by calling `pluginReactQuery({ output: { path: './hooks' } })`
 */
export function resolvePlugins(plugins: NonNullable<JSONKubbConfig['plugins']>): Array<Plugin> {
  return plugins.map(({ name, options }) => {
    const factory = pluginRegistry[name]

    if (typeof factory !== 'function') {
      throw new Error(`Plugin "${name}" is not supported. Supported plugins: ${Object.keys(pluginRegistry).join(', ')}`)
    }

    return factory(options ?? {})
  })
}
