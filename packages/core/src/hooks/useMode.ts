import type { FabricFile } from '@kubb/fabric-core/types'
import { useFabric } from '@kubb/react-fabric'

/**
 * @deprecated use `mode` from the generator component props instead
 */
export function useMode(): FabricFile.Mode {
  const { meta } = useFabric<{ mode: FabricFile.Mode }>()

  return meta.mode
}
