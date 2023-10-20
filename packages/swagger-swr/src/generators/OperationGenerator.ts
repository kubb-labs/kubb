import { getRelativePath } from '@kubb/core'
import { OperationGenerator as Generator, resolve } from '@kubb/swagger'
import { resolve as resolveSwaggerTypescript, pluginName as swaggerTypescriptPluginName } from '@kubb/swagger-ts'

import { QueryBuilder } from '../builders/QueryBuilder.tsx'
import { pluginName } from '../plugin.ts'

import type { KubbFile } from '@kubb/core'
import type { Operation, OperationSchema, OperationSchemas, Resolver } from '@kubb/swagger'
import type { FileMeta, Options as PluginOptions } from '../types.ts'

type Options = {
  clientPath?: NonNullable<PluginOptions['client']>
  clientImportPath?: NonNullable<PluginOptions['clientImportPath']>
  dataReturnType: NonNullable<PluginOptions['dataReturnType']>
}

export class OperationGenerator extends Generator<Options> {
  resolve(operation: Operation): Resolver {
    const { pluginManager } = this.context

    const name = pluginManager.resolveName({ name: `use ${operation.getOperationId()}`, pluginName })

    return resolve({
      name,
      operation,
      resolveName: pluginManager.resolveName,
      resolvePath: pluginManager.resolvePath,
      pluginName,
    })
  }

  resolveType(operation: Operation): Resolver {
    const { pluginManager } = this.context

    return resolveSwaggerTypescript({
      operation,
      resolveName: pluginManager.resolveName,
      resolvePath: pluginManager.resolvePath,
    })
  }

  resolveError(operation: Operation, statusCode: number): Resolver {
    const { pluginManager } = this.context

    const name = pluginManager.resolveName({ name: `${operation.getOperationId()} ${statusCode}`, pluginName: swaggerTypescriptPluginName })

    return resolveSwaggerTypescript({
      name,
      operation,
      resolveName: pluginManager.resolveName,
      resolvePath: pluginManager.resolvePath,
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

  async get(operation: Operation, schemas: OperationSchemas, options: Options): Promise<KubbFile.File<FileMeta> | null> {
    const { clientPath, dataReturnType } = options
    const { pluginManager, oas } = this.context

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

    const queryBuilder = new QueryBuilder({ name: hook.name, errors, dataReturnType }, { oas, pluginManager, operation, schemas })

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

  async post(operation: Operation, schemas: OperationSchemas, options: Options): Promise<KubbFile.File<FileMeta> | null> {
    const { clientPath, dataReturnType } = options
    const { pluginManager, oas } = this.context

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

    const queryBuilder = new QueryBuilder({ name: hook.name, errors, dataReturnType }, { oas, pluginManager, operation, schemas })

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

  async put(operation: Operation, schemas: OperationSchemas, options: Options): Promise<KubbFile.File<FileMeta> | null> {
    return this.post(operation, schemas, options)
  }
  async patch(operation: Operation, schemas: OperationSchemas, options: Options): Promise<KubbFile.File<FileMeta> | null> {
    return this.post(operation, schemas, options)
  }
  async delete(operation: Operation, schemas: OperationSchemas, options: Options): Promise<KubbFile.File<FileMeta> | null> {
    return this.post(operation, schemas, options)
  }
}
