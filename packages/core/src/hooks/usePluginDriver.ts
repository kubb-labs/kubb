import { useFabric } from '@kubb/react-fabric'
import type { PluginDriver } from '../PluginDriver.ts'

/**
 * @deprecated use `useKubb` instead
 */
export function usePluginDriver(): PluginDriver {
  const { meta } = useFabric<{ pluginDriver: PluginDriver }>()

  return meta.pluginDriver
}
