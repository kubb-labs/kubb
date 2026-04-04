import { useFabric } from '@kubb/react-fabric'
import type * as KubbFile from '../KubbFile.ts'

/**
 * @deprecated use `mode` from the generator component props instead
 */
export function useMode(): KubbFile.Mode {
  const { meta } = useFabric<{ mode: KubbFile.Mode }>()

  return meta.mode
}
