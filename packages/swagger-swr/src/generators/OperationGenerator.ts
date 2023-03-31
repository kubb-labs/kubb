import { camelCase, pascalCase } from 'change-case'

import type { PluginContext, File, FileManager, OptionalPath } from '@kubb/core'
import { getRelativePath, objectToParameters, createJSDocBlockText } from '@kubb/core'
import { pluginName as swaggerTypescriptPluginName } from '@kubb/swagger-ts'
import { OperationGenerator as Generator, getComments } from '@kubb/swagger'
import type { Oas, Operation, OperationSchemas } from '@kubb/swagger'

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
  async all(): Promise<File | null> {
    return null
  }

  async get(operation: Operation, schemas: OperationSchemas): Promise<File | null> {
    const { directory, resolveId, clientPath } = this.options

    // hook setup
    const hookName = `${camelCase(`use ${operation.getOperationId()}`, { delimiter: '' })}`
    const hookId = `${hookName}.ts`
    const hookFilePath = await resolveId({
      fileName: hookId,
      directory,
      pluginName,
      options: { tag: operation.getTags()[0]?.name },
    })

    if (!hookFilePath) {
      return null
    }
    // end hook setup

    // type creation

    const typeName = `${pascalCase(operation.getOperationId(), { delimiter: '' })}.ts`
    const typeFilePath = await resolveId({ fileName: typeName, directory, pluginName: swaggerTypescriptPluginName })

    // hook creation

    const comments = getComments(operation)
    const sources: string[] = []

    let url = operation.path
    let pathParamsTyped = ''
    let pathParams = ''

    if (schemas.pathParams) {
      // TODO move to it's own function(utils)
      url = url.replaceAll('{', '${')

      const data = Object.entries(schemas.pathParams.schema.properties!).map((item) => {
        return [item[0], schemas.pathParams!.name]
      })

      pathParamsTyped = objectToParameters(data, { typed: true })
      pathParams = objectToParameters(data)
    }

    if (schemas.queryParams && !schemas.pathParams) {
      sources.push(`
        export function ${camelCase(`${operation.getOperationId()}QueryOptions`)} <TData = ${schemas.response.name}>(params?: ${
        schemas.queryParams.name
      }): SWRConfiguration<TData> {

          return {
            fetcher: () => {
              return client<TData>({
                method: "get",
                url: \`${url}\`,
                params
              });
            },
          };
        };
      `)

      sources.push(`
        ${createJSDocBlockText({ comments })}
        export function ${hookName} <TData = ${schemas.response.name}>(params?: ${
        schemas.queryParams.name
      }, options?: { query?: SWRConfiguration<TData> }): SWRResponse<TData> {
          const { query: queryOptions } = options ?? {};
          
          const query = useSWR<TData, unknown, string>(\`${url}\`, {
            ...${camelCase(`${operation.getOperationId()}QueryOptions`)}<TData>(params),
            ...queryOptions
          });

          return query;
        };
      `)
    }

    if (!schemas.queryParams && schemas.pathParams) {
      sources.push(`
        export function ${camelCase(`${operation.getOperationId()}QueryOptions`)} <TData = ${
        schemas.response.name
      }>(${pathParamsTyped}): SWRConfiguration<TData> {

          return {
            fetcher: () => {
              return client<TData>({
                method: "get",
                url: \`${url}\`
              });
            },
          };
        };
      `)

      sources.push(`
        ${createJSDocBlockText({ comments })}
        export function ${hookName} <TData = ${schemas.response.name}>(${pathParamsTyped} options?: { query?: SWRConfiguration<TData> }): SWRResponse<TData> {
          const { query: queryOptions } = options ?? {};
          
          const query = useSWR<TData, unknown, string>(\`${url}\`, {
            ...${camelCase(`${operation.getOperationId()}QueryOptions`)}<TData>(${pathParams}),
            ...queryOptions
          });

          return query;
        };
      `)
    }

    if (schemas.queryParams && schemas.pathParams) {
      sources.push(`
        export function ${camelCase(`${operation.getOperationId()}QueryOptions`)} <TData = ${schemas.response.name}>(${pathParamsTyped} params?: ${
        schemas.queryParams.name
      }): SWRConfiguration<TData> {

          return {
            fetcher: () => {
              return client<TData>({
                method: "get",
                url: \`${url}\`,
                params
              });
            },
          };
        };
      `)

      sources.push(`
        ${createJSDocBlockText({ comments })}
        export function ${hookName} <TData = ${schemas.response.name}>(${pathParamsTyped} params?: ${
        schemas.queryParams.name
      }, options?: { query?: SWRConfiguration<TData> }): SWRResponse<TData> {
          const { query: queryOptions } = options ?? {};
          
          const query = useSWR<TData, unknown, string>(\`${url}\`, {
            ...${camelCase(`${operation.getOperationId()}QueryOptions`)}<TData>(${pathParams} params),
            ...queryOptions
          });

          return query;
        };
      `)
    }

    if (!schemas.queryParams && !schemas.pathParams) {
      sources.push(`
      export function ${camelCase(`${operation.getOperationId()}QueryOptions`)} <TData = ${schemas.response.name}>(): SWRConfiguration<TData> {

        return {
          fetcher: () => {
            return client<TData>({
              method: "get",
              url: \`${url}\`
            });
          },
        };
      };
    `)

      sources.push(`
        ${createJSDocBlockText({ comments })}
        export function ${hookName} <TData = ${schemas.response.name}>(options?: { query?: SWRConfiguration<TData> }): SWRResponse<TData> {
          const { query: queryOptions } = options ?? {};

          const query = useSWR<TData, unknown, string>(\`${url}\`, {
            ...${camelCase(`${operation.getOperationId()}QueryOptions`)}<TData>(),
            ...queryOptions
          });

          return query;
        };
      `)
    }

    return {
      path: hookFilePath,
      fileName: hookId,
      source: sources.join('\n'),
      imports: [
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
          path: clientPath ? getRelativePath(hookFilePath, clientPath) : '@kubb/swagger-client/client',
        },
        {
          name: [schemas.response.name, schemas.pathParams?.name, schemas.queryParams?.name].filter(Boolean) as string[],
          path: getRelativePath(hookFilePath, typeFilePath),
          isTypeOnly: true,
        },
      ],
    }
  }

  async post(operation: Operation, schemas: OperationSchemas): Promise<File | null> {
    const { directory, resolveId, clientPath } = this.options

    // hook setup
    const hookName = `${camelCase(`use ${operation.getOperationId()}`, { delimiter: '' })}`
    const hookId = `${hookName}.ts`
    const hookFilePath = await resolveId({ fileName: hookId, directory, pluginName, options: { tag: operation.getTags()[0]?.name } })
    if (!hookFilePath) {
      return null
    }
    // end hook setup

    // type creation

    const typeName = `${pascalCase(operation.getOperationId(), { delimiter: '' })}.ts`
    const typeFilePath = await resolveId({ fileName: typeName, directory, pluginName: swaggerTypescriptPluginName })

    // hook creation

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
        export function ${hookName} <TData = ${schemas.response.name}, TVariables = ${schemas.request.name}>(${pathParamsTyped} options?: {
          mutation?: SWRMutationConfiguration<TData, unknown, TVariables>
        }) {
          const { mutation: mutationOptions } = options ?? {};

          return useSWRMutation<TData, unknown, string, TVariables>(
            \`${url}\`,
            (url, { arg: data }) => {
              return client<TData, TVariables>({
                method: "post",
                url,
                data,
              })
            },
            mutationOptions
          );
        };
    `

    return {
      path: hookFilePath,
      fileName: hookId,
      source,
      imports: [
        {
          name: 'useSWRMutation',
          path: 'swr/mutation',
        },
        {
          name: ['SWRMutationConfiguration'],
          path: 'swr/mutation',
          isTypeOnly: true,
        },
        {
          name: 'client',
          path: clientPath ? getRelativePath(hookFilePath, clientPath) : '@kubb/swagger-client/client',
        },
        {
          name: [schemas.request.name, schemas.response.name, schemas.pathParams?.name, schemas.queryParams?.name].filter(Boolean) as string[],
          path: getRelativePath(hookFilePath, typeFilePath),
          isTypeOnly: true,
        },
      ],
    }

    // end hook creation
  }

  async put(operation: Operation, schemas: OperationSchemas): Promise<File | null> {
    const { directory, resolveId, clientPath } = this.options

    // hook setup
    const hookName = `${camelCase(`use ${operation.getOperationId()}`, { delimiter: '' })}`
    const hookId = `${hookName}.ts`
    const hookFilePath = await resolveId({ fileName: hookId, directory, pluginName, options: { tag: operation.getTags()[0]?.name } })
    if (!hookFilePath) {
      return null
    }
    // end hook setup

    // type creation

    const typeName = `${pascalCase(operation.getOperationId(), { delimiter: '' })}.ts`
    const typeFilePath = await resolveId({ fileName: typeName, directory, pluginName: swaggerTypescriptPluginName })

    // hook creation

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
        export function ${hookName} <TData = ${schemas.response.name}, TVariables = ${schemas.request.name}>(${pathParamsTyped} options?: {
          mutation?: SWRMutationConfiguration<TData, unknown, TVariables>
        }) {
          const { mutation: mutationOptions } = options ?? {};

          return useSWRMutation<TData, unknown, string, TVariables>(
            \`${url}\`, 
            (url, { arg: data }) => {
              return client<TData, TVariables>({
                method: "put",
                url,
                data
              });
             },
             mutationOptions
          );
        };
    `

    return {
      path: hookFilePath,
      fileName: hookId,
      source,
      imports: [
        {
          name: 'useSWRMutation',
          path: 'swr/mutation',
        },
        {
          name: ['SWRMutationConfiguration'],
          path: 'swr/mutation',
          isTypeOnly: true,
        },
        {
          name: 'client',
          path: clientPath ? getRelativePath(hookFilePath, clientPath) : '@kubb/swagger-client/client',
        },
        {
          name: [schemas.request.name, schemas.response.name, schemas.pathParams?.name, schemas.queryParams?.name].filter(Boolean) as string[],
          path: getRelativePath(hookFilePath, typeFilePath),
          isTypeOnly: true,
        },
      ],
    }

    // end hook creation
  }

  async delete(operation: Operation, schemas: OperationSchemas): Promise<File | null> {
    const { directory, resolveId, clientPath } = this.options

    // hook setup
    const hookName = `${camelCase(`use ${operation.getOperationId()}`, { delimiter: '' })}`
    const hookId = `${hookName}.ts`
    const hookFilePath = await resolveId({ fileName: hookId, directory, pluginName, options: { tag: operation.getTags()[0]?.name } })
    if (!hookFilePath) {
      return null
    }
    // end hook setup

    // type creation

    const typeName = `${pascalCase(operation.getOperationId(), { delimiter: '' })}.ts`
    const typeFilePath = await resolveId({ fileName: typeName, directory, pluginName: swaggerTypescriptPluginName })

    // hook creation

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
        export function ${hookName} <TData = ${schemas.response.name}, TVariables = ${schemas.request.name}>(${pathParamsTyped} options?: {
          mutation?: SWRMutationConfiguration<TData, unknown, TVariables>
        }) {
          const { mutation: mutationOptions } = options ?? {};

          return useSWRMutation<TData, unknown, string, TVariables>(
            \`${url}\`,
            (url) => {
              return client<TData, TVariables>({
                method: "delete",
                url,
              })
            },
            mutationOptions
          );
        };
    `

    return {
      path: hookFilePath,
      fileName: hookId,
      source,
      imports: [
        {
          name: 'useSWRMutation',
          path: 'swr/mutation',
        },
        {
          name: ['SWRMutationConfiguration'],
          path: 'swr/mutation',
          isTypeOnly: true,
        },
        {
          name: 'client',
          path: clientPath ? getRelativePath(hookFilePath, clientPath) : '@kubb/swagger-client/client',
        },
        {
          name: [schemas.request.name, schemas.response.name, schemas.pathParams?.name, schemas.queryParams?.name].filter(Boolean) as string[],
          path: getRelativePath(hookFilePath, typeFilePath),
          isTypeOnly: true,
        },
      ],
    }

    // end hook creation
  }
}
