import { useApp } from '@kubb/react-template'

import type { OperationSchemas } from '@kubb/swagger'
import type { AppMeta } from '../types.ts'

export function useSchemas(): OperationSchemas {
  const { meta } = useApp<AppMeta>()

  return meta.schemas
}
