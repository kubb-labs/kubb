import { usePluginManager } from '@kubb/react'

import type { KubbFile, Plugin } from '@kubb/core'

type Props<TOptions = object> = {
  name: string
  mode?: KubbFile.Mode
  extName: KubbFile.Extname
  pluginKey: Plugin['key']
  options?: TOptions
}

export function useFile<TOptions = object>({ name, mode, extName, pluginKey, options }: Props<TOptions>): KubbFile.File<{ pluginKey: Plugin['key'] }> {
  const pluginManager = usePluginManager()

  return pluginManager.getFile<TOptions>({ name, mode, extName, pluginKey, options })
}
