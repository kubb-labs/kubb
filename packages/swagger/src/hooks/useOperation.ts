import { useApp } from '@kubb/react'

import type { AppMeta, Operation } from '../types.ts'

export function useOperation(): Operation {
  const { meta } = useApp<AppMeta>()

  return meta.operation
}
