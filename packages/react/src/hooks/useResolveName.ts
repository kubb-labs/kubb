import { usePluginManager } from '@kubb/react'

import type { ResolveNameParams } from '@kubb/core'

type Props = ResolveNameParams

export function useResolveName(props: Props): string {
  const pluginManager = usePluginManager()

  return pluginManager.resolveName(props)
}
