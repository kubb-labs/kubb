import type { KubbFile } from '@kubb/fabric-core/types'
import { useApp } from '@kubb/react-fabric'

export function useMode(): KubbFile.Mode {
  const { meta } = useApp<{ mode: KubbFile.Mode }>()

  return meta.mode
}
