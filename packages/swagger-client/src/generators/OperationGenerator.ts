import type { PluginContext, File, FileManager, OptionalPath } from '@kubb/core'
import { getRelativePath, createJSDocBlockText } from '@kubb/core'
import { pluginName as swaggerTypescriptPluginName } from '@kubb/swagger-ts'
import { OperationGenerator as Generator, getComments, getParams, Path } from '@kubb/swagger'
import type { Oas, Operation, OperationSchemas, HttpMethod, Resolver } from '@kubb/swagger'

import { pluginName } from '../plugin'

import type { ResolvePathOptions } from '../types'

type Options = {
  clientPath?: OptionalPath
  oas: Oas
  directory: string
  fileManager: FileManager
  resolvePath: PluginContext<ResolvePathOptions>['resolvePath']
  resolveName: PluginContext['resolveName']
}

export class OperationGenerator extends Generator<Options> {
  async resolve(operation: Operation): Promise<Resolver> {
    const { directory, resolvePath, resolveName } = this.options

    const name = resolveName({ name: operation.getOperationId(), pluginName })
    const fileName = `${name}.ts`
    const filePath = await resolvePath({
      fileName,
      directory,
      options: { tag: operation.getTags()[0]?.name },
    })

    if (!filePath || !name) {
      throw new Error('Filepath should be defined')
    }

    return {
      name,
      fileName,
      filePath,
    }
  }

  async resolveType(operation: Operation): Promise<Resolver> {
    const { directory, resolvePath, resolveName } = this.options

    const name = resolveName({ name: operation.getOperationId(), pluginName: swaggerTypescriptPluginName })
    const fileName = `${name}.ts`
    const filePath = await resolvePath({ fileName, directory, options: { tag: operation.getTags()[0]?.name }, pluginName: swaggerTypescriptPluginName })

    if (!filePath || !name) {
      throw new Error('Filepath should be defined')
    }

    return {
      name,
      fileName,
      filePath,
    }
  }

  async all(paths: Record<string, Record<HttpMethod, Operation>>): Promise<File | null> {
    const { directory, resolvePath, resolveName } = this.options

    const controllerName = resolveName({ name: 'operations' })
    const controllerId = `${controllerName}.ts`
    const controllerFilePath = await resolvePath({
      fileName: controllerId,
      directory,
    })

    if (!controllerFilePath) {
      return null
    }
    // end controller setup

    const sources: string[] = []

    const groupedByOperationId: Record<string, { path: string; method: HttpMethod }> = {}

    Object.keys(paths).forEach((path) => {
      Object.keys(paths[path]).forEach((method) => {
        const operation = this.getOperation(path, method as HttpMethod)
        if (operation) {
          groupedByOperationId[operation.getOperationId()] = {
            path: new Path(path).URL,
            method: method as HttpMethod,
          }
        }
      })
    })

    sources.push(`export const operations = ${JSON.stringify(groupedByOperationId)} as const;`)

    return {
      path: controllerFilePath,
      fileName: controllerId,
      source: sources.join('\n'),
      imports: [],
    }
  }

  async get(operation: Operation, schemas: OperationSchemas): Promise<File | null> {
    const { clientPath } = this.options

    const controller = await this.resolve(operation)
    const type = await this.resolveType(operation)

    const comments = getComments(operation)
    const sources: string[] = []
    const pathParamsTyped = getParams(schemas.pathParams, { typed: true })

    sources.push(`
      ${createJSDocBlockText({ comments })}
      export function ${controller.name} <TData = ${schemas.response.name}>(${pathParamsTyped} ${
      schemas.queryParams?.name ? `params?: ${schemas.queryParams?.name}` : ''
    }) {
        return client<TData>({
          method: "get",
          url: ${new Path(operation.path).template},
          ${schemas.queryParams?.name ? 'params,' : ''}
        });
      };
    `)

    return {
      path: controller.filePath,
      fileName: controller.fileName,
      source: sources.join('\n'),
      imports: [
        {
          name: 'client',
          path: clientPath ? getRelativePath(controller.filePath, clientPath) : '@kubb/swagger-client/client',
        },
        {
          name: [schemas.response.name, schemas.pathParams?.name, schemas.queryParams?.name].filter(Boolean) as string[],
          path: getRelativePath(controller.filePath, type.filePath),
          isTypeOnly: true,
        },
      ],
    }
  }

  async post(operation: Operation, schemas: OperationSchemas): Promise<File | null> {
    const { clientPath } = this.options

    const controller = await this.resolve(operation)
    const type = await this.resolveType(operation)

    const comments = getComments(operation)
    const sources: string[] = []
    const pathParamsTyped = getParams(schemas.pathParams, { typed: true })

    sources.push(`
      ${createJSDocBlockText({ comments })}
      export function ${controller.name} <TData = ${schemas.response.name}, TVariables = ${schemas.request.name}>(${pathParamsTyped} data: TVariables, ${
      schemas.queryParams?.name ? `params?: ${schemas.queryParams?.name}` : ''
    }) {
        return client<TData, TVariables>({
          method: "post",
          url: ${new Path(operation.path).template},
          data,
          ${schemas.queryParams?.name ? 'params,' : ''}
        });
      };
    `)

    return {
      path: controller.filePath,
      fileName: controller.fileName,
      source: sources.join('\n'),
      imports: [
        {
          name: 'client',
          path: clientPath ? getRelativePath(controller.filePath, clientPath) : '@kubb/swagger-client/client',
        },
        {
          name: [schemas.request.name, schemas.response.name, schemas.pathParams?.name, schemas.queryParams?.name].filter(Boolean) as string[],
          path: getRelativePath(controller.filePath, type.filePath),
          isTypeOnly: true,
        },
      ],
    }
  }

  async put(operation: Operation, schemas: OperationSchemas): Promise<File | null> {
    const { clientPath } = this.options

    const controller = await this.resolve(operation)
    const type = await this.resolveType(operation)

    const comments = getComments(operation)
    const sources: string[] = []
    const pathParamsTyped = getParams(schemas.pathParams, { typed: true })

    sources.push(`
      ${createJSDocBlockText({ comments })}
      export function ${controller.name} <TData = ${schemas.response.name}, TVariables = ${schemas.request.name}>(${pathParamsTyped} data: TVariables, ${
      schemas.queryParams?.name ? `params?: ${schemas.queryParams?.name}` : ''
    }) {
        return client<TData, TVariables>({
          method: "put",
          url: ${new Path(operation.path).template},
          data,
          ${schemas.queryParams?.name ? 'params,' : ''}
        });
      };
    `)

    return {
      path: controller.filePath,
      fileName: controller.fileName,
      source: sources.join('\n'),
      imports: [
        {
          name: 'client',
          path: clientPath ? getRelativePath(controller.filePath, clientPath) : '@kubb/swagger-client/client',
        },
        {
          name: [schemas.request.name, schemas.response.name, schemas.pathParams?.name, schemas.queryParams?.name].filter(Boolean) as string[],
          path: getRelativePath(controller.filePath, type.filePath),
          isTypeOnly: true,
        },
      ],
    }
  }

  async delete(operation: Operation, schemas: OperationSchemas): Promise<File | null> {
    const { clientPath } = this.options

    const controller = await this.resolve(operation)
    const type = await this.resolveType(operation)

    const comments = getComments(operation)
    const sources: string[] = []
    const pathParamsTyped = getParams(schemas.pathParams, { typed: true })

    sources.push(`
      ${createJSDocBlockText({ comments })}
      export function ${controller.name} <TData = ${schemas.response.name}, TVariables = ${schemas.request.name}>(${pathParamsTyped} data: TVariables, ${
      schemas.queryParams?.name ? `params?: ${schemas.queryParams?.name}` : ''
    }) {
        return client<TData, TVariables>({
          method: "delete",
          url: ${new Path(operation.path).template},
          data,
          ${schemas.queryParams?.name ? 'params,' : ''}
        });
      };
    `)

    return {
      path: controller.filePath,
      fileName: controller.fileName,
      source: sources.join('\n'),
      imports: [
        {
          name: 'client',
          path: clientPath ? getRelativePath(controller.filePath, clientPath) : '@kubb/swagger-client/client',
        },
        {
          name: [schemas.request.name, schemas.response.name, schemas.pathParams?.name, schemas.queryParams?.name].filter(Boolean) as string[],
          path: getRelativePath(controller.filePath, type.filePath),
          isTypeOnly: true,
        },
      ],
    }
  }
}
