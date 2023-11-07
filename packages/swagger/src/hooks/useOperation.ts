import { useApp } from '@kubb/react'

import type { Operation, PluginOptions } from '../types.ts'

export function useOperation(): Operation {
  const { meta } = useApp<PluginOptions['appMeta']>()

  return meta.operation
}
