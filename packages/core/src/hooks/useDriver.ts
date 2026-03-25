import { useFabric } from '@kubb/react-fabric'
import type { PluginDriver } from '../PluginDriver.ts'

/**
 * Returns the `PluginDriver` instance from Fabric context.
 *
 * Use this inside React generator components to access the driver, config, and adapter.
 */
export function useDriver(): PluginDriver {
  const { meta } = useFabric<{ driver: PluginDriver }>()

  return meta.driver
}
