import { useFabric } from '@kubb/react-fabric'
import type { PluginDriver } from '../PluginDriver.ts'

/**
 * @deprecated use `config` from the generator component props instead
 */
export function usePluginDriver(): PluginDriver {
  const { meta } = useFabric<{ driver: PluginDriver }>()

  return meta.driver
}
