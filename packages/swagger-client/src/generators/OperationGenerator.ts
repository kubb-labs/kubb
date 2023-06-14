import { createJSDocBlockText, getRelativePath } from '@kubb/core'
import { OperationGenerator as Generator, getComments, getParams, Path } from '@kubb/swagger'
import { pluginName as swaggerTypescriptPluginName } from '@kubb/swagger-ts'

import { pluginName } from '../plugin.ts'

import type { File, OptionalPath, PluginContext } from '@kubb/core'
import type { HttpMethod, Oas, Operation, OperationSchemas, Resolver } from '@kubb/swagger'
import type { ResolvePathOptions } from '../types.ts'

type Options = {
  clientPath?: OptionalPath
  oas: Oas
  resolvePath: PluginContext<ResolvePathOptions>['resolvePath']
  resolveName: PluginContext['resolveName']
}

export class OperationGenerator extends Generator<Options> {
  resolve(operation: Operation): Resolver {
    const { resolvePath, resolveName } = this.options

    const name = resolveName({ name: operation.getOperationId(), pluginName })

    if (!name) {
      throw new Error('Name should be defined')
    }

    const fileName = `${name}.ts`
    const filePath = resolvePath({
      fileName,
      options: { tag: operation.getTags()[0]?.name },
    })

    if (!filePath) {
      throw new Error('Filepath should be defined')
    }

    return {
      name,
      fileName,
      filePath,
    }
  }

  resolveType(operation: Operation): Resolver {
    const { resolvePath, resolveName } = this.options

    const name = resolveName({ name: operation.getOperationId(), pluginName: swaggerTypescriptPluginName })

    if (!name) {
      throw new Error('Name should be defined')
    }

    const fileName = `${name}.ts`
    const filePath = resolvePath({ fileName, options: { tag: operation.getTags()[0]?.name }, pluginName: swaggerTypescriptPluginName })

    if (!filePath) {
      throw new Error('Filepath should be defined')
    }

    return {
      name,
      fileName,
      filePath,
    }
  }

  async all(paths: Record<string, Record<HttpMethod, Operation>>): Promise<File | null> {
    const { resolvePath, resolveName, oas } = this.options

    const controllerName = resolveName({ name: 'operations' })

    if (!controllerName) {
      throw new Error('controllerName should be defined')
    }

    const controllerId = `${controllerName}.ts`
    const controllerFilePath = resolvePath({
      fileName: controllerId,
    })

    if (!controllerFilePath) {
      return null
    }
    // end controller setup

    const sources: string[] = []

    const groupedByOperationId: Record<string, { path: string; method: HttpMethod }> = {}

    Object.keys(paths).forEach((path) => {
      Object.keys(paths[path]).forEach((method) => {
        const operation = oas.operation(path, method as HttpMethod)
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

    const controller = this.resolve(operation)
    const type = this.resolveType(operation)

    const comments = getComments(operation)
    const sources: string[] = []
    const pathParamsTyped = getParams(schemas.pathParams, { typed: true })

    const generics = [`TData = ${schemas.response.name}`].filter(Boolean)
    const clientGenerics = ['TData'].filter(Boolean)
    const params = [pathParamsTyped, schemas.queryParams?.name ? `params?: ${schemas.queryParams?.name}` : ''].filter(Boolean)

    sources.push(`
      ${createJSDocBlockText({ comments })}
      export function ${controller.name} <${generics.join(', ')}>(${params.join(', ')}) {
        return client<${clientGenerics.join(', ')}>({
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
          name: [schemas.response.name, schemas.pathParams?.name, schemas.queryParams?.name].filter(Boolean),
          path: getRelativePath(controller.filePath, type.filePath),
          isTypeOnly: true,
        },
      ],
    }
  }

  async post(operation: Operation, schemas: OperationSchemas): Promise<File | null> {
    const { clientPath } = this.options

    const controller = this.resolve(operation)
    const type = this.resolveType(operation)

    const comments = getComments(operation)
    const sources: string[] = []
    const pathParamsTyped = getParams(schemas.pathParams, { typed: true })

    const generics = [`TData = ${schemas.response.name}`, schemas.request?.name ? `TVariables = ${schemas.request?.name}` : ''].filter(Boolean)
    const clientGenerics = ['TData', schemas.request?.name ? 'TVariables' : ''].filter(Boolean)
    const params = [
      pathParamsTyped,
      schemas.request?.name ? 'data: TVariables' : '',
      schemas.queryParams?.name ? `params?: ${schemas.queryParams?.name}` : '',
    ].filter(Boolean)

    sources.push(`
      ${createJSDocBlockText({ comments })}
      export function ${controller.name} <${generics.join(', ')}>(${params.join(', ')}) {
        return client<${clientGenerics.join(', ')}>({
          method: "post",
          url: ${new Path(operation.path).template},
          ${schemas.request?.name ? 'data,' : ''}
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
          name: [schemas.request?.name, schemas.response.name, schemas.pathParams?.name, schemas.queryParams?.name].filter(Boolean),
          path: getRelativePath(controller.filePath, type.filePath),
          isTypeOnly: true,
        },
      ],
    }
  }

  async put(operation: Operation, schemas: OperationSchemas): Promise<File | null> {
    const { clientPath } = this.options

    const controller = this.resolve(operation)
    const type = this.resolveType(operation)

    const comments = getComments(operation)
    const sources: string[] = []
    const pathParamsTyped = getParams(schemas.pathParams, { typed: true })

    const generics = [`TData = ${schemas.response.name}`, schemas.request?.name ? `TVariables = ${schemas.request?.name}` : ''].filter(Boolean)
    const clientGenerics = ['TData', schemas.request?.name ? 'TVariables' : ''].filter(Boolean)
    const params = [
      pathParamsTyped,
      schemas.request?.name ? 'data: TVariables' : '',
      schemas.queryParams?.name ? `params?: ${schemas.queryParams?.name}` : '',
    ].filter(Boolean)

    sources.push(`
      ${createJSDocBlockText({ comments })}
      export function ${controller.name} <${generics.join(', ')}>(${params.join(', ')}) {
        return client<${clientGenerics.join(', ')}>({
          method: "put",
          url: ${new Path(operation.path).template},
          ${schemas.request?.name ? 'data,' : ''}
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
          name: [schemas.request?.name, schemas.response.name, schemas.pathParams?.name, schemas.queryParams?.name].filter(Boolean),
          path: getRelativePath(controller.filePath, type.filePath),
          isTypeOnly: true,
        },
      ],
    }
  }

  async delete(operation: Operation, schemas: OperationSchemas): Promise<File | null> {
    const { clientPath } = this.options

    const controller = this.resolve(operation)
    const type = this.resolveType(operation)

    const comments = getComments(operation)
    const sources: string[] = []
    const pathParamsTyped = getParams(schemas.pathParams, { typed: true })

    const generics = [`TData = ${schemas.response.name}`, schemas.request?.name ? `TVariables = ${schemas.request?.name}` : ''].filter(Boolean)
    const clientGenerics = ['TData', schemas.request?.name ? 'TVariables' : ''].filter(Boolean)
    const params = [
      pathParamsTyped,
      schemas.request?.name ? 'data: TVariables' : '',
      schemas.queryParams?.name ? `params?: ${schemas.queryParams?.name}` : '',
    ].filter(Boolean)

    sources.push(`
      ${createJSDocBlockText({ comments })}
      export function ${controller.name} <${generics.join(', ')}>(${params.join(', ')}) {
        return client<${clientGenerics.join(', ')}>({
          method: "delete",
          url: ${new Path(operation.path).template},
          ${schemas.request?.name ? 'data,' : ''}
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
          name: [schemas.request?.name, schemas.response.name, schemas.pathParams?.name, schemas.queryParams?.name].filter(Boolean),
          path: getRelativePath(controller.filePath, type.filePath),
          isTypeOnly: true,
        },
      ],
    }
  }
}
