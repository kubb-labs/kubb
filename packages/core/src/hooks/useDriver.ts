import { useFabric } from '@kubb/react-fabric'
import type { PluginDriver } from '../PluginDriver.ts'

/**
 * @deprecated use `driver` from the generator component props instead
 */
export function useDriver(): PluginDriver {
  const { meta } = useFabric<{ driver: PluginDriver }>()

  return meta.driver
}
