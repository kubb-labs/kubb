import { usePluginManager } from '@kubb/react'

import type { KubbFile, ResolvePathParams } from '@kubb/core'

type Props = ResolvePathParams

/**
 * Resolve a path based on what has been set inside the `resolvePath` of a specific plugin.
 * Use `pluginKey` to retreive the path of that specific plugin.
 */
export function useResolvePath(props: Props): KubbFile.OptionalPath {
  const pluginManager = usePluginManager()

  return pluginManager.resolvePath(props)
}
