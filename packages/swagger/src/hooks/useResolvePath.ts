import { usePluginManager } from '@kubb/react'

import type { KubbFile, ResolvePathParams } from '@kubb/core'

type Props = ResolvePathParams

export function useResolvePath(props: Props): KubbFile.OptionalPath {
  const pluginManager = usePluginManager()

  return pluginManager.resolvePath(props)
}
