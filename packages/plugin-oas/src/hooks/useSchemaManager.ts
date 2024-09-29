import { useApp } from '@kubb/react'

import type { FileMetaBase, Plugin, ResolveNameParams } from '@kubb/core'
import type * as KubbFile from '@kubb/fs/types'
import type { Mode } from '@kubb/fs/types'
import { SchemaGenerator } from '../SchemaGenerator.ts'
import { type Schema, schemaKeywords } from '../SchemaMapper'

type FileMeta = FileMetaBase & {
  pluginKey: Plugin['key']
  name: string
  tag?: string
}

type UseSchemaManagerResult = {
  getName: (name: string, params: { pluginKey?: Plugin['key']; type: ResolveNameParams['type'] }) => string
  getFile: (name: string, params?: { pluginKey?: Plugin['key']; mode?: Mode; extname?: KubbFile.Extname; tag?: string }) => KubbFile.File<FileMeta>
  getImports: (tree: Array<Schema>) => Array<KubbFile.Import>
}

/**
 * `useSchemaManager` will return some helper functions that can be used to get the schema file, get the schema name.
 */
export function useSchemaManager(): UseSchemaManagerResult {
  const { mode, plugin, pluginManager, fileManager } = useApp()

  const getName: UseSchemaManagerResult['getName'] = (name, { pluginKey = plugin.key, type }) => {
    return pluginManager.resolveName({
      name,
      pluginKey,
      type,
    })
  }
  //TODO replace tag with group
  const getFile: UseSchemaManagerResult['getFile'] = (name, { mode = 'split', pluginKey = plugin.key, extname = '.ts', tag } = {}) => {
    const resolvedName = mode === 'single' ? '' : getName(name, { type: 'file', pluginKey })

    const file = pluginManager.getFile({
      name: resolvedName,
      extname,
      pluginKey,
      options: { type: 'file', pluginKey, tag },
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
      ?.map((item, i) => {
        if (!item.args.path) {
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
