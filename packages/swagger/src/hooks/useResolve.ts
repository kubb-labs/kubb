import { usePluginManager } from '@kubb/react'
import { useOperation } from '@kubb/swagger'

import { resolve } from '../utils/resolve.ts'

import type { ResolveProps, Resolver } from '@kubb/swagger'

type ResolvePath = ResolveProps['resolvePath']

type ResolveName = ResolveProps['resolveName']

export type UseResolveProps = Omit<ResolveProps, 'operation' | 'resolvePath' | 'resolveName'> & {
  resolvePath?: ResolvePath
  resolveName?: ResolveName
}

export function useResolvePath(props: Parameters<ResolvePath>[0]): ReturnType<ResolvePath> {
  const pluginManager = usePluginManager()

  return pluginManager.resolvePath(props)
}

export function useResolveName(props: Parameters<ResolveName>[0]): ReturnType<ResolveName> {
  const pluginManager = usePluginManager()

  return pluginManager.resolveName(props)
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
