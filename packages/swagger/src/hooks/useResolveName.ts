import { usePluginManager } from '@kubb/react'

import type { KubbPlugin } from '@kubb/core'

type Props = {
  name: string
  pluginKey: KubbPlugin['key'] | undefined
  type?: 'file' | 'function' | 'type'
}

export function useResolveName(props: Props): string {
  const pluginManager = usePluginManager()

  return pluginManager.resolveName(props)
}
