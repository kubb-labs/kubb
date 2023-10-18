import { getRelativePath } from '@kubb/core'
import { OperationGenerator as Generator, resolve } from '@kubb/swagger'
import { resolve as resolveSwaggerTypescript, pluginName as swaggerTypescriptPluginName } from '@kubb/swagger-ts'

import { QueryBuilder } from '../builders/QueryBuilder.tsx'
import { pluginName } from '../plugin.ts'

import type { KubbFile, PluginContext, PluginManager } from '@kubb/core'
import type { ContentType, Oas, Operation, OperationSchema, OperationSchemas, ResolvePathOptions, Resolver, SkipBy } from '@kubb/swagger'
import type { FileMeta, Options as PluginOptions } from '../types.ts'

type Options = {
  pluginManager: PluginManager
  clientPath?: KubbFile.OptionalPath
  clientImportPath?: KubbFile.OptionalPath
  dataReturnType: PluginOptions['dataReturnType']
  oas: Oas
  contentType?: ContentType
  skipBy?: SkipBy[]
  resolvePath: PluginContext<ResolvePathOptions>['resolvePath']
  resolveName: PluginContext['resolveName']
}

export class OperationGenerator extends Generator<Options> {
  resolve(operation: Operation): Resolver {
    const { resolvePath, resolveName } = this.options

    const name = resolveName({ name: `use ${operation.getOperationId()}`, pluginName })

    return resolve({
      name,
      operation,
      resolveName,
      resolvePath,
      pluginName,
    })
  }

  resolveType(operation: Operation): Resolver {
    const { resolvePath, resolveName } = this.options

    return resolveSwaggerTypescript({
      operation,
      resolveName,
      resolvePath,
    })
  }

  resolveError(operation: Operation, statusCode: number): Resolver {
    const { resolvePath, resolveName } = this.options

    const name = resolveName({ name: `${operation.getOperationId()} ${statusCode}`, pluginName: swaggerTypescriptPluginName })

    return resolveSwaggerTypescript({
      name,
      operation,
      resolveName,
      resolvePath,
    })
  }

  resolveErrors(operation: Operation, errors: OperationSchema[]): Resolver[] {
    return errors
      .map((item) => {
        if (item.statusCode) {
          return this.resolveError(operation, item.statusCode)
        }
        return undefined
      })
      .filter(Boolean)
  }

  async all(): Promise<KubbFile.File | null> {
    return null
  }

  async get(operation: Operation, schemas: OperationSchemas): Promise<KubbFile.File<FileMeta> | null> {
    const { pluginManager, oas, clientPath, dataReturnType } = this.options

    const hook = this.resolve(operation)
    const type = this.resolveType(operation)
    const clientImportPath = this.options.clientImportPath
      ? this.options.clientImportPath
      : clientPath
      ? getRelativePath(hook.path, clientPath)
      : '@kubb/swagger-client/client'

    let errors: Resolver[] = []

    if (schemas.errors) {
      errors = this.resolveErrors(operation, schemas.errors)
    }

    const queryBuilder = new QueryBuilder(oas).configure({ pluginManager, name: hook.name, errors, operation, schemas, dataReturnType })

    const file = queryBuilder.render('query', hook.name).file

    if (!file) {
      throw new Error('No <File/> being used or File is undefined(see resolvePath/resolveName)')
    }

    return {
      path: file.path,
      baseName: file.baseName,
      source: file.source,
      imports: [
        ...(file.imports || []),
        {
          name: 'useSWR',
          path: 'swr',
        },
        {
          name: ['SWRConfiguration', 'SWRResponse'],
          path: 'swr',
          isTypeOnly: true,
        },
        {
          name: 'client',
          path: clientImportPath,
        },
        {
          name: ['ResponseConfig'],
          path: clientImportPath,
          isTypeOnly: true,
        },
        {
          name: [
            schemas.response.name,
            schemas.pathParams?.name,
            schemas.queryParams?.name,
            schemas.headerParams?.name,
            ...errors.map((error) => error.name),
          ].filter(Boolean),
          path: getRelativePath(hook.path, type.path),
          isTypeOnly: true,
        },
      ],
      meta: {
        pluginName,
        tag: operation.getTags()[0]?.name,
      },
    }
  }

  async post(operation: Operation, schemas: OperationSchemas): Promise<KubbFile.File<FileMeta> | null> {
    const { pluginManager, oas, clientPath, dataReturnType } = this.options

    const hook = this.resolve(operation)
    const type = this.resolveType(operation)
    const clientImportPath = this.options.clientImportPath
      ? this.options.clientImportPath
      : clientPath
      ? getRelativePath(hook.path, clientPath)
      : '@kubb/swagger-client/client'

    let errors: Resolver[] = []

    if (schemas.errors) {
      errors = this.resolveErrors(operation, schemas.errors)
    }

    const queryBuilder = new QueryBuilder(oas).configure({ pluginManager, name: hook.name, errors, operation, schemas, dataReturnType })

    const file = queryBuilder.render('mutation', hook.name).file

    if (!file) {
      throw new Error('No <File/> being used or File is undefined(see resolvePath/resolveName)')
    }

    return {
      path: file.path,
      baseName: file.baseName,
      source: file.source,
      imports: [
        ...(file.imports || []),
        {
          name: 'useSWRMutation',
          path: 'swr/mutation',
        },
        {
          name: ['SWRMutationConfiguration', 'SWRMutationResponse'],
          path: 'swr/mutation',
          isTypeOnly: true,
        },
        {
          name: 'client',
          path: clientImportPath,
        },
        {
          name: ['ResponseConfig'],
          path: clientImportPath,
          isTypeOnly: true,
        },
        {
          name: [
            schemas.request?.name,
            schemas.response.name,
            schemas.pathParams?.name,
            schemas.queryParams?.name,
            schemas.headerParams?.name,
            ...errors.map((error) => error.name),
          ].filter(Boolean),
          path: getRelativePath(hook.path, type.path),
          isTypeOnly: true,
        },
      ],
      meta: {
        pluginName,
        tag: operation.getTags()[0]?.name,
      },
    }
  }

  async put(operation: Operation, schemas: OperationSchemas): Promise<KubbFile.File<FileMeta> | null> {
    return this.post(operation, schemas)
  }
  async patch(operation: Operation, schemas: OperationSchemas): Promise<KubbFile.File<FileMeta> | null> {
    return this.post(operation, schemas)
  }
  async delete(operation: Operation, schemas: OperationSchemas): Promise<KubbFile.File<FileMeta> | null> {
    return this.post(operation, schemas)
  }
}
