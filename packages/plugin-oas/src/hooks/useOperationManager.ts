import { useApp, useContext } from '@kubb/react'

import { Oas } from '../components/Oas.tsx'

import type { FileMetaBase, Plugin, ResolveNameParams } from '@kubb/core'
import type * as KubbFile from '@kubb/fs/types'
import type { Operation, Operation as OperationType } from '@kubb/oas'
import type { OperationSchemas } from '../types.ts'

type FileMeta = FileMetaBase & {
  pluginKey: Plugin['key']
  name: string
  tag?: string
}

export type SchemaNames = {
  request: string | undefined
  parameters: {
    path: string | undefined
    query: string | undefined
    header: string | undefined
  }
  responses: { default?: string } & Record<number | string, string>
  errors: Record<number | string, string>
}

type UseOperationManagerResult = {
  getName: (
    operation: OperationType,
    params: {
      prefix?: string
      suffix?: string
      pluginKey?: Plugin['key']
      type: ResolveNameParams['type']
    },
  ) => string
  getSchemaName: (
    operation: Operation,
    key: keyof Omit<OperationSchemas, 'errors' | 'statusCodes'>,
    params?: {
      pluginKey?: Plugin['key']
      type?: ResolveNameParams['type']
    },
  ) => string
  getFile: (
    operation: OperationType,
    params?: {
      prefix?: string
      suffix?: string
      pluginKey?: Plugin['key']
      extName?: KubbFile.Extname
      tag?: string
    },
  ) => KubbFile.File<FileMeta>
  groupSchemasByName: (
    operation: OperationType,
    params: {
      pluginKey?: Plugin['key']
      type: ResolveNameParams['type']
    },
  ) => SchemaNames
  getSchemas: (operation: Operation, params?: { pluginKey?: Plugin['key']; type?: ResolveNameParams['type'] }) => OperationSchemas
}

/**
 * `useOperationManager` will return some helper functions that can be used to get the operation file, get the operation name.
 */
export function useOperationManager(): UseOperationManagerResult {
  const { plugin, pluginManager } = useApp()
  const { generator } = useContext(Oas.Context)

  const getName: UseOperationManagerResult['getName'] = (operation, { prefix = '', suffix = '', pluginKey = plugin.key, type }) => {
    return pluginManager.resolveName({
      name: `${prefix} ${operation.getOperationId()} ${suffix}`,
      pluginKey,
      type,
    })
  }

  const getSchemas: UseOperationManagerResult['getSchemas'] = (operation, params) => {
    if (!generator) {
      throw new Error(`'generator' is not defined`)
    }

    return generator.getSchemas(operation, {
      resolveName: (name) =>
        pluginManager.resolveName({
          name,
          pluginKey: params?.pluginKey,
          type: params?.type,
        }),
    })
  }

  const getSchemaName: UseOperationManagerResult['getSchemaName'] = (operation, key, { pluginKey = plugin.key, type } = {}) => {
    const schemas = getSchemas(operation)

    if (!schemas[key]?.name) {
      throw new Error(`SchemaName not found for ${operation.getOperationId()}`)
    }

    return pluginManager.resolveName({
      name: schemas[key]?.name,
      pluginKey,
      type,
    })
  }
  //TODO replace tag with group
  const getFile: UseOperationManagerResult['getFile'] = (
    operation,
    { prefix, suffix, pluginKey = plugin.key, tag = operation.getTags().at(0)?.name, extName = '.ts' } = {},
  ) => {
    const name = getName(operation, { type: 'file', pluginKey, prefix, suffix })
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

  const groupSchemasByName: UseOperationManagerResult['groupSchemasByName'] = (operation, { pluginKey = plugin.key, type }) => {
    if (!generator) {
      throw new Error(`'generator' is not defined`)
    }

    const schemas = generator.getSchemas(operation)

    const errors = (schemas.errors || []).reduce(
      (prev, acc) => {
        if (!acc.statusCode) {
          return prev
        }

        prev[acc.statusCode] = pluginManager.resolveName({
          name: acc.name,
          pluginKey,
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
        ['default']: pluginManager.resolveName({
          name: schemas.response.name,
          pluginKey,
          type,
        }),
        ...errors,
      },
      errors,
    }
  }

  return {
    getName,
    getFile,
    getSchemas,
    getSchemaName,
    groupSchemasByName,
  }
}
