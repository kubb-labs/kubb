import { usePluginManager } from '@kubb/react'

import type { KubbFile, Plugin, ResolveNameParams } from '@kubb/core'
import type { Operation as OperationType } from '../oas/index.ts'

type FileMeta = KubbFile.FileMetaBase & {
  pluginKey: Plugin['key']
  name: string
  tag?: string
}

type UseOperationHelpersResult = {
  getOperationName: (operation: OperationType, params: { pluginKey?: Plugin['key']; type: ResolveNameParams['type'] }) => string
  getOperationFile: (operation: OperationType, params: { pluginKey: Plugin['key']; extName?: KubbFile.Extname }) => KubbFile.File<FileMeta>
}

export function useOperationHelpers(): UseOperationHelpersResult {
  const pluginManager = usePluginManager()

  const getOperationName: UseOperationHelpersResult['getOperationName'] = (operation, { pluginKey, type }) => {
    return pluginManager.resolveName({ name: operation.getOperationId(), pluginKey, type })
  }

  const getOperationFile: UseOperationHelpersResult['getOperationFile'] = (operation, { pluginKey, extName = '.ts' }) => {
    // needed for the `output.group`
    const tag = operation?.getTags().at(0)?.name
    const name = getOperationName(operation, { type: 'file', pluginKey })

    const file = pluginManager.getFile({ name, extName, pluginKey, options: { type: 'file', pluginKey, tag } })

    return {
      ...file,
      meta: {
        ...file.meta,
        name,
        pluginKey,
        tag,
      },
    }
  }

  return {
    getOperationName,
    getOperationFile,
  }
}
