import { readSync } from '@kubb/core/fs'
import { usePluginManager } from '@kubb/react'

import type { KubbFile, Plugin } from '@kubb/core'

type Props<TOptions = object> = {
  name: string
  extName: KubbFile.Extname
  pluginKey: Plugin['key']
  options?: TOptions
}

export function useFile<TOptions = object>({ name, extName, pluginKey, options }: Props<TOptions>): KubbFile.File<{ pluginKey: Plugin['key'] }> {
  const pluginManager = usePluginManager()

  let source = ''
  const baseName = `${name}${extName}` as const
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
