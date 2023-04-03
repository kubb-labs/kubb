import { camelCase } from 'change-case'

import type { PluginContext, File, FileManager, OptionalPath } from '@kubb/core'
import { getRelativePath, createJSDocBlockText } from '@kubb/core'
import { pluginName as swaggerTypescriptPluginName } from '@kubb/swagger-ts'
import { OperationGenerator as Generator, Path, getComments } from '@kubb/swagger'
import type { Oas, Operation, OperationSchemas, Resolver } from '@kubb/swagger'

import { pluginName } from '../plugin'

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
  async resolve(operation: Operation): Promise<Resolver> {
    const { directory, resolvePath, resolveName } = this.options

    const name = resolveName({ name: `use ${operation.getOperationId()}`, pluginName })
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
    const filePath = await resolvePath({ fileName, directory, pluginName: swaggerTypescriptPluginName })

    if (!filePath || !name) {
      throw new Error('Filepath should be defined')
    }

    return {
      name,
      fileName,
      filePath,
    }
  }

  async all(): Promise<File | null> {
    return null
  }

  async get(operation: Operation, schemas: OperationSchemas): Promise<File | null> {
    const { clientPath } = this.options

    const hook = await this.resolve(operation)
    const type = await this.resolveType(operation)

    const comments = getComments(operation)
    const sources: string[] = []
    const pathParams = this.getParams(schemas.pathParams)
    const pathParamsTyped = this.getParams(schemas.pathParams, { typed: true })

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
        export function ${hook.name} <TData = ${schemas.response.name}>(params?: ${
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
        export function ${hook.name} <TData = ${schemas.response.name}>(${pathParamsTyped} options?: { query?: SWRConfiguration<TData> }): SWRResponse<TData> {
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
        export function ${hook.name} <TData = ${schemas.response.name}>(${pathParamsTyped} params?: ${
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
        export function ${hook.name} <TData = ${schemas.response.name}>(options?: { query?: SWRConfiguration<TData> }): SWRResponse<TData> {
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
      path: hook.filePath,
      fileName: hook.fileName,
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
          path: clientPath ? getRelativePath(hook.filePath, clientPath) : '@kubb/swagger-client/client',
        },
        {
          name: [schemas.response.name, schemas.pathParams?.name, schemas.queryParams?.name].filter(Boolean) as string[],
          path: getRelativePath(hook.filePath, type.filePath),
          isTypeOnly: true,
        },
      ],
    }
  }

  async post(operation: Operation, schemas: OperationSchemas): Promise<File | null> {
    const { clientPath } = this.options

    const hook = await this.resolve(operation)
    const type = await this.resolveType(operation)

    const comments = getComments(operation)
    const sources: string[] = []
    const pathParamsTyped = this.getParams(schemas.pathParams, { typed: true })

    sources.push(`
        ${createJSDocBlockText({ comments })}
        export function ${hook.name} <TData = ${schemas.response.name}, TVariables = ${schemas.request.name}>(${pathParamsTyped} options?: {
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
    `)

    return {
      path: hook.filePath,
      fileName: hook.fileName,
      source: sources.join('\n'),
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
          path: clientPath ? getRelativePath(hook.filePath, clientPath) : '@kubb/swagger-client/client',
        },
        {
          name: [schemas.request.name, schemas.response.name, schemas.pathParams?.name, schemas.queryParams?.name].filter(Boolean) as string[],
          path: getRelativePath(hook.filePath, type.filePath),
          isTypeOnly: true,
        },
      ],
    }
  }

  async put(operation: Operation, schemas: OperationSchemas): Promise<File | null> {
    const { clientPath } = this.options

    const hook = await this.resolve(operation)
    const type = await this.resolveType(operation)

    const comments = getComments(operation)
    const sources: string[] = []
    const pathParamsTyped = this.getParams(schemas.pathParams, { typed: true })

    sources.push(`
        ${createJSDocBlockText({ comments })}
        export function ${hook.name} <TData = ${schemas.response.name}, TVariables = ${schemas.request.name}>(${pathParamsTyped} options?: {
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
    `)

    return {
      path: hook.filePath,
      fileName: hook.fileName,
      source: sources.join('\n'),
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
          path: clientPath ? getRelativePath(hook.filePath, clientPath) : '@kubb/swagger-client/client',
        },
        {
          name: [schemas.request.name, schemas.response.name, schemas.pathParams?.name, schemas.queryParams?.name].filter(Boolean) as string[],
          path: getRelativePath(hook.filePath, type.filePath),
          isTypeOnly: true,
        },
      ],
    }
  }

  async delete(operation: Operation, schemas: OperationSchemas): Promise<File | null> {
    const { clientPath } = this.options

    const hook = await this.resolve(operation)
    const type = await this.resolveType(operation)

    const comments = getComments(operation)
    const sources: string[] = []
    const pathParamsTyped = this.getParams(schemas.pathParams, { typed: true })

    sources.push(`
        ${createJSDocBlockText({ comments })}
        export function ${hook.name} <TData = ${schemas.response.name}, TVariables = ${schemas.request.name}>(${pathParamsTyped} options?: {
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
    `)

    return {
      path: hook.filePath,
      fileName: hook.fileName,
      source: sources.join('\n'),
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
          path: clientPath ? getRelativePath(hook.filePath, clientPath) : '@kubb/swagger-client/client',
        },
        {
          name: [schemas.request.name, schemas.response.name, schemas.pathParams?.name, schemas.queryParams?.name].filter(Boolean) as string[],
          path: getRelativePath(hook.filePath, type.filePath),
          isTypeOnly: true,
        },
      ],
    }
  }
}
