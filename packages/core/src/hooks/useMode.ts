import type { KubbFile } from '@kubb/fabric-core/types'
import { useFabric } from '@kubb/react-fabric'

/**
 * @deprecated use `mode` from the generator component props instead
 */
export function useMode(): KubbFile.Mode {
  const { meta } = useFabric<{ mode: KubbFile.Mode }>()

  return meta.mode
}
