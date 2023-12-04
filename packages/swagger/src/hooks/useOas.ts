import { useApp } from '@kubb/react'

import type { Oas } from '../oas/index.ts'
import type { PluginOptions } from '../types.ts'

export function useOas(): Oas {
  const { meta } = useApp<PluginOptions['appMeta']>()

  return meta.oas
}
