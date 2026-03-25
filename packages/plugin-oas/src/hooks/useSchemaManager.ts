import type { FileMetaBase, ResolveNameParams } from '@kubb/core'
import { useDriver, usePlugin } from '@kubb/core/hooks'
import type { FabricFile } from '@kubb/fabric-core/types'

type FileMeta = FileMetaBase & {
  pluginName: string
  name: string
  group?: {
    tag?: string
    path?: string
  }
}

type UseSchemaManagerResult = {
  getName: (name: string, params: { pluginName?: string; type: ResolveNameParams['type'] }) => string
  getFile: (
    name: string,
    params?: {
      pluginName?: string
      mode?: FabricFile.Mode
      extname?: FabricFile.Extname
      group?: {
        tag?: string
        path?: string
      }
    },
  ) => FabricFile.File<FileMeta>
}

/**
 * `useSchemaManager` returns helper functions to get the schema file and schema name.
 * @deprecated
 */
export function useSchemaManager(): UseSchemaManagerResult {
  const plugin = usePlugin()
  const driver = useDriver()

  const getName: UseSchemaManagerResult['getName'] = (name, { pluginName = plugin.name, type }) => {
    return driver.resolveName({
      name,
      pluginName,
      type,
    })
  }

  const getFile: UseSchemaManagerResult['getFile'] = (name, { mode = 'split', pluginName = plugin.name, extname = '.ts', group } = {}) => {
    const resolvedName = mode === 'single' ? '' : getName(name, { type: 'file', pluginName })

    const file = driver.getFile({
      name: resolvedName,
      extname,
      pluginName,
      options: { type: 'file', pluginName, group },
    })

    return {
      ...file,
      meta: {
        ...file.meta,
        name: resolvedName,
        pluginName,
      },
    }
  }

  return {
    getName,
    getFile,
  }
}
