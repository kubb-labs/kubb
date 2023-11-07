import { useApp } from '@kubb/react'

import type { OperationSchemas, PluginOptions } from '../types.ts'

export function useSchemas(): OperationSchemas {
  const { meta } = useApp<PluginOptions['appMeta']>()

  return meta.schemas
}
