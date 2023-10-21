import { useResolve as useResolveSwagger } from '@kubb/swagger'

import { pluginKey } from '../plugin.ts'

import type { Resolver, UseResolveProps } from '@kubb/swagger'

export function useResolve(props: UseResolveProps = {}): Resolver {
  return useResolveSwagger({ pluginKey, ...props })
}
