import { useContext, usePlugin, usePluginManager } from '@kubb/react'

import { Oas } from '../components/Oas.tsx'

import type { KubbFile, Plugin, ResolveNameParams } from '@kubb/core'
import type { GetSchemas } from '../components/Oas.tsx'
import type { Operation as OperationType } from '../oas/index.ts'

type FileMeta = KubbFile.FileMetaBase & {
  pluginKey: Plugin['key']
  name: string
  tag?: string
}

type UseOperationHelpersResult = {
  getName: (operation: OperationType, params: { pluginKey?: Plugin['key']; type: ResolveNameParams['type'] }) => string
  getFile: (operation: OperationType, params: { pluginKey: Plugin['key']; extName?: KubbFile.Extname }) => KubbFile.File<FileMeta>
  getSchemas: GetSchemas
}

export function useOperationHelpers(): UseOperationHelpersResult {
  const pluginManager = usePluginManager()
  const { getSchemas } = useContext(Oas.Context)

  const getName: UseOperationHelpersResult['getName'] = (operation, { pluginKey, type }) => {
    return pluginManager.resolveName({ name: operation.getOperationId(), pluginKey, type })
  }

  const getFile: UseOperationHelpersResult['getFile'] = (operation, { pluginKey, extName = '.ts' }) => {
    // needed for the `output.group`
    const tag = operation?.getTags().at(0)?.name
    const name = getName(operation, { type: 'file', pluginKey })

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

  if (!getSchemas) {
    throw new Error(`'getSchemas' is not defined`)
  }

  return {
    getName,
    getFile,
    getSchemas,
  }
}
