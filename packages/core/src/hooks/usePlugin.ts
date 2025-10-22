import { useApp } from '@kubb/react'
import type { Plugin, PluginFactoryOptions } from '../types.ts'

export function usePlugin<TOptions extends PluginFactoryOptions = PluginFactoryOptions>(): Plugin<TOptions> {
  const { meta } = useApp<{ plugin: Plugin<TOptions> }>()

  return meta.plugin
}
