import type { FileMetaBase, PluginFactoryOptions, ResolveNameParams } from '@kubb/core'
import { usePlugin, usePluginDriver } from '@kubb/core/hooks'
import type { KubbFile } from '@kubb/fabric-core/types'
import type { Operation, Operation as OperationType } from '@kubb/oas'
import type { OperationGenerator } from '../OperationGenerator.ts'
import type { OperationSchemas } from '../types.ts'

type FileMeta = FileMetaBase & {
  pluginName: string
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
      pluginName?: string
      type: ResolveNameParams['type']
    },
  ) => string
  getFile: (
    operation: OperationType,
    params?: {
      prefix?: string
      suffix?: string
      pluginName?: string
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
      pluginName?: string
      type: ResolveNameParams['type']
    },
  ) => SchemaNames
  getSchemas: (operation: Operation, params?: { pluginName?: string; type?: ResolveNameParams['type'] }) => OperationSchemas
  getGroup: (operation: Operation) => FileMeta['group'] | undefined
}

/**
 * `useOperationManager` returns helper functions to get the operation file and operation name.
 */
export function useOperationManager<TPluginOptions extends PluginFactoryOptions = PluginFactoryOptions>(
  generator: Omit<OperationGenerator<TPluginOptions>, 'build'>,
): UseOperationManagerResult {
  const plugin = usePlugin()
  const driver = usePluginDriver()
  const defaultPluginName = plugin.name

  const getName: UseOperationManagerResult['getName'] = (operation, { prefix = '', suffix = '', pluginName = defaultPluginName, type }) => {
    return driver.resolveName({
      name: `${prefix} ${operation.getOperationId()} ${suffix}`,
      pluginName,
      type,
    })
  }

  const getGroup: UseOperationManagerResult['getGroup'] = (operation) => {
    return {
      tag: operation.getTags().at(0)?.name ?? 'default',
      path: operation.path,
    }
  }

  const getSchemas: UseOperationManagerResult['getSchemas'] = (operation, params) => {
    if (!generator) {
      throw new Error(`useOperationManager: 'generator' parameter is required but was not provided`)
    }

    return generator.getSchemas(operation, {
      resolveName: (name) =>
        driver.resolveName({
          name,
          pluginName: params?.pluginName ?? defaultPluginName,
          type: params?.type,
        }),
    })
  }

  const getFile: UseOperationManagerResult['getFile'] = (operation, { prefix, suffix, pluginName = defaultPluginName, extname = '.ts' } = {}) => {
    const name = getName(operation, { type: 'file', pluginName, prefix, suffix })
    const group = getGroup(operation)

    const file = driver.getFile({
      name,
      extname,
      pluginName,
      options: { type: 'file', pluginName, group },
    })

    return {
      ...file,
      meta: {
        ...file.meta,
        name,
        pluginName,
        group,
      },
    }
  }

  const groupSchemasByName: UseOperationManagerResult['groupSchemasByName'] = (operation, { pluginName = defaultPluginName, type }) => {
    if (!generator) {
      throw new Error(`useOperationManager: 'generator' parameter is required but was not provided`)
    }

    const schemas = getSchemas(operation)

    const errors = (schemas.errors || []).reduce(
      (prev, acc) => {
        if (!acc.statusCode) {
          return prev
        }

        prev[acc.statusCode] = driver.resolveName({
          name: acc.name,
          pluginName,
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

        prev[acc.statusCode] = driver.resolveName({
          name: acc.name,
          pluginName,
          type,
        })

        return prev
      },
      {} as Record<number, string>,
    )

    return {
      request: schemas.request?.name
        ? driver.resolveName({
            name: schemas.request.name,
            pluginName,
            type,
          })
        : undefined,
      parameters: {
        path: schemas.pathParams?.name
          ? driver.resolveName({
              name: schemas.pathParams.name,
              pluginName,
              type,
            })
          : undefined,
        query: schemas.queryParams?.name
          ? driver.resolveName({
              name: schemas.queryParams.name,
              pluginName,
              type,
            })
          : undefined,
        header: schemas.headerParams?.name
          ? driver.resolveName({
              name: schemas.headerParams.name,
              pluginName,
              type,
            })
          : undefined,
      },
      responses: {
        ...responses,
        ['default']: driver.resolveName({
          name: schemas.response.name,
          pluginName,
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
