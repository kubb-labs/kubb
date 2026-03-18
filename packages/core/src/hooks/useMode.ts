import type { KubbFile } from '@kubb/fabric-core/types'
import { useFabric } from '@kubb/react-fabric'

/**
 * @deprecated use `useKubb` instead
 */
export function useMode(): KubbFile.Mode {
  const { meta } = useFabric<{ mode: KubbFile.Mode }>()

  return meta.mode
}
