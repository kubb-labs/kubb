import { useResolve as useResolveSwagger } from '@kubb/swagger/hooks'

import { pluginKey } from '../plugin.ts'

import type { Resolver } from '@kubb/swagger'
import type { UseResolveProps } from '@kubb/swagger/hooks'

export function useResolve(props: UseResolveProps = {}): Resolver {
  return useResolveSwagger({ pluginKey, ...props })
}
