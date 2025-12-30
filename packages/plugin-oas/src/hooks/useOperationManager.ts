import type { FileMetaBase, NameRole, Plugin, PluginFactoryOptions, ResolveNameParams } from '@kubb/core'
import { usePlugin, usePluginManager } from '@kubb/core/hooks'
import type { KubbFile } from '@kubb/fabric-core/types'
import type { Operation, Operation as OperationType } from '@kubb/oas'
import type { OperationGenerator } from '../OperationGenerator.ts'
import type { OperationSchemas } from '../types.ts'

type FileMeta = FileMetaBase & {
  pluginKey: Plugin['key']
  name: string
  group?: {
    tag?: string
    path?: string
  }
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
      /**
       * @deprecated Use `role` instead
       */
      type?: ResolveNameParams['type']
      /**
       * Role of the name being resolved
       */
      role?: NameRole
    },
  ) => string
  getFile: (
    operation: OperationType,
    params?: {
      prefix?: string
      suffix?: string
      pluginKey?: Plugin['key']
      extname?: KubbFile.Extname
      group?: {
        tag?: string
        path?: string
      }
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
  getGroup: (operation: Operation) => FileMeta['group'] | undefined
}

/**
 * `useOperationManager` will return some helper functions that can be used to get the operation file, get the operation name.
 */
export function useOperationManager<TPluginOptions extends PluginFactoryOptions = PluginFactoryOptions>(
  generator: Omit<OperationGenerator<TPluginOptions>, 'build'>,
): UseOperationManagerResult {
  const plugin = usePlugin()
  const pluginManager = usePluginManager()

  const getName: UseOperationManagerResult['getName'] = (operation, { prefix, suffix, pluginKey = plugin.key, type, role }) => {
    // New API: use role with options
    if (role) {
      return pluginManager.resolveName({
        name: operation.getOperationId(),
        pluginKey,
        options: {
          role,
          prefix,
          suffix,
        },
      })
    }
    
    // Old API: backward compatibility - manually build name string
    if (type) {
      const prefixStr = prefix || ''
      const suffixStr = suffix || ''
      return pluginManager.resolveName({
        name: `${prefixStr} ${operation.getOperationId()} ${suffixStr}`,
        pluginKey,
        type,
      })
    }
    
    throw new Error('Either `role` or `type` must be provided to getName')
  }

  const getGroup: UseOperationManagerResult['getGroup'] = (operation) => {
    return {
      tag: operation.getTags().at(0)?.name,
      path: operation.path,
    }
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

  const getFile: UseOperationManagerResult['getFile'] = (operation, { prefix, suffix, pluginKey = plugin.key, extname = '.ts' } = {}) => {
    const name = getName(operation, { type: 'file', pluginKey, prefix, suffix })
    const group = getGroup(operation)

    const file = pluginManager.getFile({
      name,
      extname,
      pluginKey,
      options: { type: 'file', pluginKey, group },
    })

    return {
      ...file,
      meta: {
        ...file.meta,
        name,
        pluginKey,
        group,
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

    const responses = (schemas.responses || []).reduce(
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
        ...responses,
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
    groupSchemasByName,
    getGroup,
  }
}
