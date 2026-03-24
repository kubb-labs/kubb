import { useFabric } from '@kubb/react-fabric'
import type { Plugin, PluginFactoryOptions } from '../types.ts'

/**
 * @deprecated use useKubb instead
 */
export function usePlugin<TOptions extends PluginFactoryOptions = PluginFactoryOptions>(): Plugin<TOptions> {
  const { meta } = useFabric<{ plugin: Plugin<TOptions> }>()

  return meta.plugin
}
