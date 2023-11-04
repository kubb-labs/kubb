import { useApp } from '@kubb/react'

import type { AppMeta, OperationSchemas } from '../types.ts'

export function useSchemas(): OperationSchemas {
  const { meta } = useApp<AppMeta>()

  return meta.schemas
}
