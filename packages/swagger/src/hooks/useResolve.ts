import { usePluginManager } from '@kubb/react'

import { useOperation } from '../hooks/useOperation.ts'
import { resolve } from '../resolve.ts'

import type { KubbFile, ResolveNameParams, ResolvePathParams } from '@kubb/core'
import type { ResolveProps } from '../resolve.ts'
import type { Resolver } from '../types.ts'

export type UseResolveProps = Omit<ResolveProps, 'operation' | 'resolvePath' | 'resolveName'> & {
  resolvePath?: (params: ResolvePathParams<Record<string, unknown>>) => KubbFile.OptionalPath
  resolveName?: (params: ResolveNameParams) => string
}

export function useResolvePath(props: ResolvePathParams): KubbFile.OptionalPath {
  const pluginManager = usePluginManager()

  return pluginManager.resolvePath(props)
}

export function useResolveName(props: Partial<ResolveNameParams>): string {
  const pluginManager = usePluginManager()
  const operation = useOperation()

  return pluginManager.resolveName({ ...props, name: props.name || operation?.getOperationId() })
}

export function useResolve(props: UseResolveProps = {}): Resolver {
  const operation = useOperation()
  const pluginManager = usePluginManager()

  return resolve({
    operation,
    ...props,
    resolvePath: props.resolvePath || pluginManager.resolvePath,
    resolveName: props.resolveName || pluginManager.resolveName,
  })
}
