import { useApp, useContext } from '@kubb/react'

import { Oas } from '../components/Oas.tsx'

import type { KubbFile, Plugin, ResolveNameParams } from '@kubb/core'
import type { GetOperationSchemas } from '../components/Oas.tsx'
import type { Operation as OperationType } from '../oas/index.ts'

type FileMeta = KubbFile.FileMetaBase & {
  pluginKey: Plugin['key']
  name: string
  tag?: string
}

type SchemaNames = {
  request: string | undefined
  parameters: {
    path: string | undefined
    query: string | undefined
    header: string | undefined
  }
  responses: Record<number, string>
}

type UseOperationManagerResult = {
  getName: (operation: OperationType, params: { pluginKey?: Plugin['key']; type: ResolveNameParams['type'] }) => string
  getFile: (operation: OperationType, params?: { pluginKey?: Plugin['key']; extName?: KubbFile.Extname }) => KubbFile.File<FileMeta>
  groupSchemasByByName: (operation: OperationType, params: { pluginKey?: Plugin['key']; type: ResolveNameParams['type'] }) => SchemaNames
  getSchemas: GetOperationSchemas
}

/**
 * `useOperationManager` will return some helper functions that can be used to get the operation file, get the operation name.
 */
export function useOperationManager(): UseOperationManagerResult {
  const { plugin, pluginManager } = useApp()
  const { getOperationSchemas } = useContext(Oas.Context)

  if (!getOperationSchemas) {
    throw new Error(`'getOperationSchemas' is not defined`)
  }

  const getName: UseOperationManagerResult['getName'] = (operation, { pluginKey = plugin.key, type }) => {
    return pluginManager.resolveName({
      name: operation.getOperationId(),
      pluginKey,
      type,
    })
  }

  const getFile: UseOperationManagerResult['getFile'] = (operation, { pluginKey = plugin.key, extName = '.ts' } = {}) => {
    // needed for the `output.group`
    const tag = operation.getTags().at(0)?.name
    const name = getName(operation, { type: 'file', pluginKey })

    const file = pluginManager.getFile({
      name,
      extName,
      pluginKey,
      options: { type: 'file', pluginKey, tag },
    })

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

  const groupSchemasByByName: UseOperationManagerResult['groupSchemasByByName'] = (operation, { pluginKey = plugin.key, type }) => {
    const schemas = getOperationSchemas(operation)

    const errors = (schemas.errors || []).reduce(
      (prev, acc) => {
        if (!acc.statusCode) {
          return prev
        }

        prev[acc.statusCode] = pluginManager.resolveName({
          name: acc.name,
          pluginKey: plugin.key,
          type,
        })

        return prev
      },
      {} as Record<number, string>,
    )

    return {
      request: schemas.request?.name
        ? pluginManager.resolveName({
            name: schemas.request.name,
            pluginKey,
            type,
          })
        : undefined,
      parameters: {
        path: schemas.pathParams?.name
          ? pluginManager.resolveName({
              name: schemas.pathParams.name,
              pluginKey,
              type,
            })
          : undefined,
        query: schemas.queryParams?.name
          ? pluginManager.resolveName({
              name: schemas.queryParams.name,
              pluginKey,
              type,
            })
          : undefined,
        header: schemas.headerParams?.name
          ? pluginManager.resolveName({
              name: schemas.headerParams.name,
              pluginKey,
              type,
            })
          : undefined,
      },
      responses: {
        [schemas.response.statusCode || 'default']: pluginManager.resolveName({
          name: schemas.response.name,
          pluginKey,
          type,
        }),
        ...errors,
      },
    }
  }

  return {
    getName,
    getFile,
    getSchemas: getOperationSchemas,
    groupSchemasByByName,
  }
}
