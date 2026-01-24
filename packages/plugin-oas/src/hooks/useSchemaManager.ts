import type { FileMetaBase, Plugin, ResolveNameParams } from '@kubb/core'
import { usePlugin, usePluginManager } from '@kubb/core/hooks'
import type { KubbFile } from '@kubb/fabric-core/types'
import { SchemaGenerator } from '../SchemaGenerator.ts'
import { type Schema, schemaKeywords } from '../SchemaMapper'

type FileMeta = FileMetaBase & {
  pluginKey: Plugin['key']
  name: string
  group?: {
    tag?: string
    path?: string
  }
}

type UseSchemaManagerResult = {
  getName: (name: string, params: { pluginKey?: Plugin['key']; type: ResolveNameParams['type'] }) => string
  getFile: (
    name: string,
    params?: {
      pluginKey?: Plugin['key']
      mode?: KubbFile.Mode
      extname?: KubbFile.Extname
      group?: {
        tag?: string
        path?: string
      }
    },
  ) => KubbFile.File<FileMeta>
  getImports: (tree: Array<Schema>) => Array<KubbFile.Import>
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

  const getImports: UseSchemaManagerResult['getImports'] = (tree) => {
    const refs = SchemaGenerator.deepSearch(tree, schemaKeywords.ref)

    return refs
      ?.map((item) => {
        if (!item.args.path || !item.args.isImportable) {
          return undefined
        }

        return {
          name: [item.args.name],
          path: item.args.path,
        }
      })
      .filter(Boolean)
  }

  return {
    getName,
    getFile,
    getImports,
  }
}
