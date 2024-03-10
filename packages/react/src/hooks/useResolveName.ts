import { usePluginManager } from '@kubb/react'

import type { ResolveNameParams } from '@kubb/core'

type Props = ResolveNameParams

/**
 * Resolve a name based on what has been set inside the `resolveName` of a specific plugin.
 * Use `pluginKey` to retreive the name of that specific plugin.
 */
export function useResolveName(props: Props): string {
  const pluginManager = usePluginManager()

  return pluginManager.resolveName(props)
}
