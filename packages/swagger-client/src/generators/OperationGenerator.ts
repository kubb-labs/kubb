import { camelCase, pascalCase } from 'change-case'

import type { PluginContext, File, FileManager, OptionalPath } from '@kubb/core'
import { getRelativePath, objectToParameters, createJSDocBlockText } from '@kubb/core'
import { pluginName as swaggerTypescriptPluginName } from '@kubb/swagger-ts'
import { OperationGenerator as Generator, getComments } from '@kubb/swagger'
import type { Oas, Operation, OperationSchemas, HttpMethod } from '@kubb/swagger'

import { pluginName } from '../plugin'

import type { ResolveIdOptions } from '../types'

type Options = {
  clientPath?: OptionalPath
  oas: Oas
  directory: string
  fileManager: FileManager
  resolveId: PluginContext<ResolveIdOptions>['resolveId']
}

export class OperationGenerator extends Generator<Options> {
  async all(paths: Record<string, Record<HttpMethod, Operation | undefined>>): Promise<File | null> {
    const { directory, resolveId } = this.options

    // controller setup
    const controllerName = `${camelCase('operations', { delimiter: '' })}`
    const controllerId = `${controllerName}.ts`
    const controllerFilePath = await resolveId({
      fileName: controllerId,
      directory,
      pluginName,
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
            // TODO add util
            path: path.replaceAll('{', ':').replaceAll('}', ''),
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
    const { directory, resolveId, clientPath } = this.options

    // controller setup
    const controllerName = `${camelCase(operation.getOperationId(), { delimiter: '' })}`
    const controllerId = `${controllerName}.ts`
    const controllerFilePath = await resolveId({
      fileName: controllerId,
      directory,
      pluginName,
      options: { tag: operation.getTags()[0]?.name },
    })

    if (!controllerFilePath) {
      return null
    }
    // end controller setup

    // type creation

    const typeName = `${pascalCase(operation.getOperationId(), { delimiter: '' })}.ts`
    const typeFilePath = await resolveId({ fileName: typeName, directory, pluginName: swaggerTypescriptPluginName })

    // controller creation

    const comments = getComments(operation)
    const sources: string[] = []
    let url = operation.path
    let pathParamsTyped = ''

    if (schemas.pathParams) {
      // TODO move to it's own function(utils)
      url = url.replaceAll('{', '${')

      const data = Object.entries(schemas.pathParams.schema.properties!).map((item) => {
        return [item[0], schemas.pathParams!.name]
      })

      pathParamsTyped = objectToParameters(data, { typed: true })
    }

    if (schemas.queryParams && !schemas.pathParams) {
      sources.push(`
        ${createJSDocBlockText({ comments })}
        export function ${controllerName} <TData = ${schemas.response.name}>(params?: ${schemas.queryParams.name}) {
          return client<TData>({
            method: "get",
            url: \`${url}\`,
            params
          });
        };
      `)
    }

    if (!schemas.queryParams && schemas.pathParams) {
      sources.push(`
        ${createJSDocBlockText({ comments })}
        export function ${controllerName} <TData = ${schemas.response.name}>(${pathParamsTyped}) {
          return client<TData>({
            method: "get",
            url: \`${url}\`
          });
        };
      `)
    }

    if (schemas.queryParams && schemas.pathParams) {
      sources.push(`
        ${createJSDocBlockText({ comments })}
        export function ${controllerName} <TData = ${schemas.response.name}>(${pathParamsTyped} params?: ${schemas.queryParams.name}) {
          return client<TData>({
            method: "get",
            url: \`${url}\`,
            params
          });
        };
      `)
    }

    if (!schemas.queryParams && !schemas.pathParams) {
      sources.push(`
        ${createJSDocBlockText({ comments })}
        export function ${controllerName} <TData = ${schemas.response.name}>() {
          return client<TData>({
            method: "get",
            url: \`${url}\`
          });
        };
      `)
    }

    return {
      path: controllerFilePath,
      fileName: controllerId,
      source: sources.join('\n'),
      imports: [
        {
          name: 'client',
          path: clientPath ? getRelativePath(controllerFilePath, clientPath) : '@kubb/swagger-client/client',
        },
        {
          name: [schemas.response.name, schemas.pathParams?.name, schemas.queryParams?.name].filter(Boolean) as string[],
          path: getRelativePath(controllerFilePath, typeFilePath),
          isTypeOnly: true,
        },
      ],
    }
  }

  async post(operation: Operation, schemas: OperationSchemas): Promise<File | null> {
    const { directory, resolveId, clientPath } = this.options

    // controller setup
    const controllerName = `${camelCase(operation.getOperationId(), { delimiter: '' })}`
    const controllerId = `${controllerName}.ts`
    const controllerFilePath = await resolveId({ fileName: controllerId, directory, pluginName, options: { tag: operation.getTags()[0]?.name } })
    if (!controllerFilePath) {
      return null
    }
    // end controller setup

    // type creation

    const typeName = `${pascalCase(operation.getOperationId(), { delimiter: '' })}.ts`
    const typeFilePath = await resolveId({ fileName: typeName, directory, pluginName: swaggerTypescriptPluginName })

    // controller creation

    const comments = getComments(operation)

    let url = operation.path
    let pathParamsTyped = ''

    if (schemas.pathParams) {
      // TODO move to it's own function(utils)
      url = url.replaceAll('{', '${')

      pathParamsTyped = Object.entries(schemas.pathParams.schema.properties!)
        .reduce((acc, [key, value], index, arr) => {
          acc.push(`${key}: ${schemas.pathParams!.name}["${key}"], `)

          return acc
        }, [] as string[])
        .join('')
    }

    const source = `
        ${createJSDocBlockText({ comments })}
        export function ${controllerName} <TData = ${schemas.response.name}, TVariables = ${schemas.request.name}>(${pathParamsTyped} data: TVariables) {
          return client<TData, TVariables>({
            method: "post",
            url: \`${url}\`,
            data,
          });
        };
    `

    return {
      path: controllerFilePath,
      fileName: controllerId,
      source,
      imports: [
        {
          name: 'client',
          path: clientPath ? getRelativePath(controllerFilePath, clientPath) : '@kubb/swagger-client/client',
        },
        {
          name: [schemas.request.name, schemas.response.name, schemas.pathParams?.name, schemas.queryParams?.name].filter(Boolean) as string[],
          path: getRelativePath(controllerFilePath, typeFilePath),
          isTypeOnly: true,
        },
      ],
    }

    // end controller creation
  }

  async put(operation: Operation, schemas: OperationSchemas): Promise<File | null> {
    const { directory, resolveId, clientPath } = this.options

    // controller setup
    const controllerName = `${camelCase(operation.getOperationId(), { delimiter: '' })}`
    const controllerId = `${controllerName}.ts`
    const controllerFilePath = await resolveId({ fileName: controllerId, directory, pluginName, options: { tag: operation.getTags()[0]?.name } })
    if (!controllerFilePath) {
      return null
    }
    // end controller setup

    // type creation

    const typeName = `${pascalCase(operation.getOperationId(), { delimiter: '' })}.ts`
    const typeFilePath = await resolveId({ fileName: typeName, directory, pluginName: swaggerTypescriptPluginName })

    // controller creation

    const comments = getComments(operation)

    let url = operation.path
    let pathParamsTyped = ''

    if (schemas.pathParams) {
      // TODO move to it's own function(utils)
      url = url.replaceAll('{', '${')

      pathParamsTyped = Object.entries(schemas.pathParams.schema.properties!)
        .reduce((acc, [key, value], index, arr) => {
          acc.push(`${key}: ${schemas.pathParams!.name}["${key}"], `)

          return acc
        }, [] as string[])
        .join('')
    }

    const source = `
        ${createJSDocBlockText({ comments })}
        export function ${controllerName} <TData = ${schemas.response.name}, TVariables = ${schemas.request.name}>(${pathParamsTyped} data: TVariables) {
          return client<TData, TVariables>({
            method: "put",
            url: \`${url}\`,
            data
          });
        };
    `

    return {
      path: controllerFilePath,
      fileName: controllerId,
      source,
      imports: [
        {
          name: 'client',
          path: clientPath ? getRelativePath(controllerFilePath, clientPath) : '@kubb/swagger-client/client',
        },
        {
          name: [schemas.request.name, schemas.response.name, schemas.pathParams?.name, schemas.queryParams?.name].filter(Boolean) as string[],
          path: getRelativePath(controllerFilePath, typeFilePath),
          isTypeOnly: true,
        },
      ],
    }

    // end controller creation
  }

  async delete(operation: Operation, schemas: OperationSchemas): Promise<File | null> {
    const { directory, resolveId, clientPath } = this.options

    // controller setup
    const controllerName = `${camelCase(operation.getOperationId(), { delimiter: '' })}`
    const controllerId = `${controllerName}.ts`
    const controllerFilePath = await resolveId({ fileName: controllerId, directory, pluginName, options: { tag: operation.getTags()[0]?.name } })
    if (!controllerFilePath) {
      return null
    }
    // end controller setup

    // type creation

    const typeName = `${pascalCase(operation.getOperationId(), { delimiter: '' })}.ts`
    const typeFilePath = await resolveId({ fileName: typeName, directory, pluginName: swaggerTypescriptPluginName })

    // controller creation

    const comments = getComments(operation)

    let url = operation.path
    let pathParamsTyped = ''

    if (schemas.pathParams) {
      // TODO move to it's own function(utils)
      url = url.replaceAll('{', '${')

      pathParamsTyped = Object.entries(schemas.pathParams.schema.properties!)
        .reduce((acc, [key, value], index, arr) => {
          acc.push(`${key}: ${schemas.pathParams!.name}["${key}"], `)

          return acc
        }, [] as string[])
        .join('')
    }

    const source = `
        ${createJSDocBlockText({ comments })}
        export function ${controllerName} <TData = ${schemas.response.name}, TVariables = ${schemas.request.name}>(${pathParamsTyped}) {
          return client<TData, TVariables>({
            method: "delete",
            url: \`${url}\`
          });
        };
    `

    return {
      path: controllerFilePath,
      fileName: controllerId,
      source,
      imports: [
        {
          name: 'client',
          path: clientPath ? getRelativePath(controllerFilePath, clientPath) : '@kubb/swagger-client/client',
        },
        {
          name: [schemas.request.name, schemas.response.name, schemas.pathParams?.name, schemas.queryParams?.name].filter(Boolean) as string[],
          path: getRelativePath(controllerFilePath, typeFilePath),
          isTypeOnly: true,
        },
      ],
    }

    // end controller creation
  }
}
