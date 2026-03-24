import type { Oas } from '@kubb/oas'

import { useFabric } from '@kubb/react-fabric'

export function useOas(): Oas {
  const { meta } = useFabric<{ oas: Oas }>()

  return meta.oas
}
