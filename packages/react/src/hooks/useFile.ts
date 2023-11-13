import { readSync } from '@kubb/core/utils'
import { usePluginManager } from '@kubb/react'

import type { KubbFile, KubbPlugin } from '@kubb/core'

type Props<TOptions = object> = {
  name: string
  pluginKey: KubbPlugin['key']
  options?: TOptions
}

export function useFile<TOptions = object>({ name, pluginKey, options }: Props<TOptions>): KubbFile.File<{ pluginKey: KubbPlugin['key'] }> {
  const pluginManager = usePluginManager()

  let source = ''
  const baseName = `${name}.ts` as const
  const path = pluginManager.resolvePath({ baseName, pluginKey, options })

  if (!path) {
    throw new Error(`Filepath should be defined for resolvedName "${name}" and pluginKey [${JSON.stringify(pluginKey)}]`)
  }

  try {
    source = readSync(path)
  } catch (_e) {
    //
  }

  return {
    path,
    baseName,
    meta: {
      pluginKey,
    },
    source,
  }
}
