import { useFabric } from '@kubb/react-fabric'
import type { PluginDriver } from '../PluginDriver.ts'

export function useDriver(): PluginDriver {
  const { meta } = useFabric<{ driver: PluginDriver }>()

  return meta.driver
}
