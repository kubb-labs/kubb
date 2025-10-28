import type { Oas } from '@kubb/oas'

import { useApp } from '@kubb/react-fabric'

export function useOas(): Oas {
  const { meta } = useApp<{ oas: Oas }>()

  return meta.oas
}
