import { camelCase } from 'change-case'

import type { PluginContext, File, FileManager, OptionalPath } from '@kubb/core'
import { getRelativePath, objectToParameters, createJSDocBlockText } from '@kubb/core'
import { pluginName as swaggerTypescriptPluginName } from '@kubb/swagger-ts'
import { OperationGenerator as Generator, Path, getComments } from '@kubb/swagger'
import type { Oas, Operation, OperationSchemas } from '@kubb/swagger'

import type { resolvePathOptions } from '../types'

type Options = {
  clientPath?: OptionalPath
  oas: Oas
  directory: string
  fileManager: FileManager
  resolvePath: PluginContext<resolvePathOptions>['resolvePath']
  resolveName: PluginContext['resolveName']
}

export class OperationGenerator extends Generator<Options> {
  async all(): Promise<File | null> {
    return null
  }

  async get(operation: Operation, schemas: OperationSchemas): Promise<File | null> {
    const { directory, resolvePath, resolveName, clientPath } = this.options

    // hook setup
    const hookName = resolveName({ name: `use ${operation.getOperationId()}` })
    const hookId = `${hookName}.ts`
    const hookFilePath = await resolvePath({
      fileName: hookId,
      directory,
      options: { tag: operation.getTags()[0]?.name },
    })

    if (!hookFilePath) {
      return null
    }
    // end hook setup

    // type creation

    const typeName = `${resolveName({ name: operation.getOperationId(), pluginName: swaggerTypescriptPluginName })}.ts`
    const typeFilePath = await resolvePath({ fileName: typeName, directory, pluginName: swaggerTypescriptPluginName })

    // hook creation

    const comments = getComments(operation)
    const sources: string[] = []

    let pathParamsTyped = ''
    let pathParams = ''

    if (schemas.pathParams) {
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
                url: ${new Path(operation.path).template},
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
          
          const query = useSWR<TData, unknown, string>(${new Path(operation.path).template}, {
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
                url: ${new Path(operation.path).template}
              });
            },
          };
        };
      `)

      sources.push(`
        ${createJSDocBlockText({ comments })}
        export function ${hookName} <TData = ${schemas.response.name}>(${pathParamsTyped} options?: { query?: SWRConfiguration<TData> }): SWRResponse<TData> {
          const { query: queryOptions } = options ?? {};
          
          const query = useSWR<TData, unknown, string>(${new Path(operation.path).template}, {
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
                url: ${new Path(operation.path).template},
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
          
          const query = useSWR<TData, unknown, string>(${new Path(operation.path).template}, {
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
              url: ${new Path(operation.path).template}
            });
          },
        };
      };
    `)

      sources.push(`
        ${createJSDocBlockText({ comments })}
        export function ${hookName} <TData = ${schemas.response.name}>(options?: { query?: SWRConfiguration<TData> }): SWRResponse<TData> {
          const { query: queryOptions } = options ?? {};

          const query = useSWR<TData, unknown, string>(${new Path(operation.path).template}, {
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
    const { directory, resolvePath, resolveName, clientPath } = this.options

    // hook setup
    const hookName = resolveName({ name: `use ${operation.getOperationId()}` })
    const hookId = `${hookName}.ts`
    const hookFilePath = await resolvePath({ fileName: hookId, directory, options: { tag: operation.getTags()[0]?.name } })
    if (!hookFilePath) {
      return null
    }
    // end hook setup

    // type creation

    const typeName = `${resolveName({ name: operation.getOperationId(), pluginName: swaggerTypescriptPluginName })}.ts`
    const typeFilePath = await resolvePath({ fileName: typeName, directory, pluginName: swaggerTypescriptPluginName })

    // hook creation

    const comments = getComments(operation)

    let pathParamsTyped = ''

    if (schemas.pathParams) {
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
          ${new Path(operation.path).template},
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
    const { directory, resolvePath, resolveName, clientPath } = this.options

    // hook setup
    const hookName = resolveName({ name: `use ${operation.getOperationId()}` })
    const hookId = `${hookName}.ts`
    const hookFilePath = await resolvePath({ fileName: hookId, directory, options: { tag: operation.getTags()[0]?.name } })
    if (!hookFilePath) {
      return null
    }
    // end hook setup

    // type creation

    const typeName = `${resolveName({ name: operation.getOperationId(), pluginName: swaggerTypescriptPluginName })}.ts`
    const typeFilePath = await resolvePath({ fileName: typeName, directory, pluginName: swaggerTypescriptPluginName })

    // hook creation

    const comments = getComments(operation)

    let pathParamsTyped = ''

    if (schemas.pathParams) {
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
            ${new Path(operation.path).template}, 
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
    const { directory, resolvePath, resolveName, clientPath } = this.options

    // hook setup
    const hookName = resolveName({ name: `use ${operation.getOperationId()}` })
    const hookId = `${hookName}.ts`
    const hookFilePath = await resolvePath({ fileName: hookId, directory, options: { tag: operation.getTags()[0]?.name } })
    if (!hookFilePath) {
      return null
    }
    // end hook setup

    // type creation

    const typeName = `${resolveName({ name: operation.getOperationId(), pluginName: swaggerTypescriptPluginName })}.ts`
    const typeFilePath = await resolvePath({ fileName: typeName, directory, pluginName: swaggerTypescriptPluginName })

    // hook creation

    const comments = getComments(operation)

    let pathParamsTyped = ''

    if (schemas.pathParams) {
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
            ${new Path(operation.path).template},
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
