import type { FileMetaBase, Plugin, ResolveNameParams } from '@kubb/core'
import { usePlugin, usePluginManager } from '@kubb/core/hooks'
import type { KubbFile } from '@kubb/fabric-core/types'

type FileMeta = FileMetaBase & {
  pluginKey: Plugin['key']
  name: string
  group?: {
    tag?: string
    path?: string
  }
}

type UseSchemaManagerResult = {
  /**
   * @deprecated
   */
  getName: (name: string, params: { pluginKey?: Plugin['key']; type: ResolveNameParams['type'] }) => string
  /**
   * @deprecated
   */
  getFile: (
    name: string,
    params?: {
      pluginKey?: Plugin['key']
      mode?: KubbFile.Mode
      /**
       * @deprecated
       */
      extname?: KubbFile.Extname
      group?: {
        tag?: string
        path?: string
      }
    },
  ) => KubbFile.File<FileMeta>
}

/**
 * `useSchemaManager` returns helper functions to get the schema file and schema name.
 */
export function useSchemaManager(): UseSchemaManagerResult {
  const plugin = usePlugin()
  const pluginManager = usePluginManager()

  const getName: UseSchemaManagerResult['getName'] = (name, { pluginKey = plugin.key, type }) => {
    return pluginManager.resolveName({
      name,
      pluginKey,
      type,
    })
  }

  const getFile: UseSchemaManagerResult['getFile'] = (name, { mode = 'split', pluginKey = plugin.key, extname = '.ts', group } = {}) => {
    const resolvedName = mode === 'single' ? '' : getName(name, { type: 'file', pluginKey })

    const file = pluginManager.getFile({
      name: resolvedName,
      extname,
      pluginKey,
      options: { type: 'file', pluginKey, group },
    })

    return {
      ...file,
      meta: {
        ...file.meta,
        name: resolvedName,
        pluginKey,
      },
    }
  }

  return {
    getName,
    getFile,
  }
}
