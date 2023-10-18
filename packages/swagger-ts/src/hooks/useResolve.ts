import { useResolve as useResolveSwagger } from '@kubb/swagger'

import { pluginName } from '../plugin.ts'

import type { Resolver, UseResolveProps } from '@kubb/swagger'

type Props = UseResolveProps & { pluginName?: never }

export function useResolve(props: Props = {}): Resolver {
  return useResolveSwagger({ pluginName, ...props })
}
