import { camelCase, pascalCase } from 'change-case'

import type { PluginContext, File, FileManager, OptionalPath } from '@kubb/core'
import { getRelativePath, objectToParameters, createJSDocBlockText } from '@kubb/core'
import { pluginName as swaggerTypescriptPluginName } from '@kubb/swagger-ts'
import { OperationGenerator as Generator } from '@kubb/swagger'
import type { Oas } from '@kubb/swagger'

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
  async getGet(path: string): Promise<File | null> {
    const { oas, directory, resolveId, clientPath } = this.options

    const operation = oas.operation(path, 'get')

    if (!operation.schema.operationId) return null

    // controller setup
    const controllerName = `${camelCase(operation.getOperationId(), { delimiter: '' })}`
    const controllerId = `${controllerName}.ts`
    const controllerFilePath = await resolveId({
      fileName: controllerId,
      directory,
      pluginName,
      options: { tag: operation.getTags()[0].name },
    })

    if (!controllerFilePath) {
      return null
    }
    // end controller setup

    // type creation

    const schemas = this.getSchemas(operation)

    const typeName = `${pascalCase(operation.getOperationId(), { delimiter: '' })}.ts`
    const typeFilePath = await resolveId({ fileName: typeName, directory, pluginName: swaggerTypescriptPluginName })

    // controller creation

    const comments = this.getComments(operation)
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
        export const ${controllerName} = <TData = ${schemas.response.name}>(params?: ${schemas.queryParams.name}) => {
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
        export const ${controllerName} = <TData = ${schemas.response.name}>(${pathParamsTyped}
      }) => {
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
        export const ${controllerName} = <TData = ${schemas.response.name}>(${pathParamsTyped} params?: ${schemas.queryParams.name}) => {
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
        export const ${controllerName} = <TData = ${schemas.response.name}>() => {
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

  async getPost(path: string): Promise<File | null> {
    const { oas, directory, resolveId, clientPath } = this.options

    const operation = oas.operation(path, 'post')

    if (!operation.schema.operationId) return null

    // controller setup
    const controllerName = `${camelCase(operation.getOperationId(), { delimiter: '' })}`
    const controllerId = `${controllerName}.ts`
    const controllerFilePath = await resolveId({ fileName: controllerId, directory, pluginName, options: { tag: operation.getTags()[0].name } })
    if (!controllerFilePath) {
      return null
    }
    // end controller setup

    // type creation

    const schemas = this.getSchemas(operation)

    const typeName = `${pascalCase(operation.getOperationId(), { delimiter: '' })}.ts`
    const typeFilePath = await resolveId({ fileName: typeName, directory, pluginName: swaggerTypescriptPluginName })

    // controller creation

    const comments = this.getComments(operation)

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
        export const ${controllerName} = <TData = ${schemas.response.name}, TVariables = ${schemas.request.name}>(${pathParamsTyped} data: TVariables) => {
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

  async getPut(path: string): Promise<File | null> {
    const { oas, directory, resolveId, clientPath } = this.options

    const operation = oas.operation(path, 'put')

    if (!operation.schema.operationId) return null

    // controller setup
    const controllerName = `${camelCase(operation.getOperationId(), { delimiter: '' })}`
    const controllerId = `${controllerName}.ts`
    const controllerFilePath = await resolveId({ fileName: controllerId, directory, pluginName, options: { tag: operation.getTags()[0].name } })
    if (!controllerFilePath) {
      return null
    }
    // end controller setup

    // type creation

    const schemas = this.getSchemas(operation)

    const typeName = `${pascalCase(operation.getOperationId(), { delimiter: '' })}.ts`
    const typeFilePath = await resolveId({ fileName: typeName, directory, pluginName: swaggerTypescriptPluginName })

    // controller creation

    const comments = this.getComments(operation)

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
        export const ${controllerName} = <TData = ${schemas.response.name}, TVariables = ${schemas.request.name}>(${pathParamsTyped} data: TVariables) => {
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

  async getDelete(path: string): Promise<File | null> {
    const { oas, directory, resolveId, clientPath } = this.options

    const operation = oas.operation(path, 'delete')

    if (!operation.schema.operationId) return null

    // controller setup
    const controllerName = `${camelCase(operation.getOperationId(), { delimiter: '' })}`
    const controllerId = `${controllerName}.ts`
    const controllerFilePath = await resolveId({ fileName: controllerId, directory, pluginName, options: { tag: operation.getTags()[0].name } })
    if (!controllerFilePath) {
      return null
    }
    // end controller setup

    // type creation

    const schemas = this.getSchemas(operation)

    const typeName = `${pascalCase(operation.getOperationId(), { delimiter: '' })}.ts`
    const typeFilePath = await resolveId({ fileName: typeName, directory, pluginName: swaggerTypescriptPluginName })

    // controller creation

    const comments = this.getComments(operation)

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
        export const ${controllerName} = <TData = ${schemas.response.name}, TVariables = ${schemas.request.name}>(${pathParamsTyped}) => {
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

  async build() {
    return this.buildOperations({
      fileManager: this.options.fileManager,
      oas: this.options.oas,
    })
  }
}
