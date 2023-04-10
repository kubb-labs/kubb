import { camelCase } from 'change-case'

import type { PluginContext, File, FileManager, OptionalPath } from '@kubb/core'
import { getRelativePath, createJSDocBlockText } from '@kubb/core'
import { pluginName as swaggerTypescriptPluginName } from '@kubb/swagger-ts'
import { OperationGenerator as Generator, Path, getComments, getParams } from '@kubb/swagger'
import type { Oas, Operation, OperationSchemas, Resolver } from '@kubb/swagger'

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

  async resolveError(operation: Operation, statusCode: number): Promise<Resolver> {
    const { directory, resolvePath, resolveName } = this.options

    const name = await resolveName({ name: `${operation.getOperationId()} ${statusCode}`, pluginName: swaggerTypescriptPluginName })
    const fileName = `${name}.ts`
    const filePath = await resolvePath({
      fileName,
      directory,
      options: { tag: operation.getTags()[0]?.name },
      pluginName: swaggerTypescriptPluginName,
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

  async resolveErrors(items: Array<{ operation: Operation; statusCode: number }>): Promise<Resolver[]> {
    return Promise.all(items.map((item) => this.resolveError(item.operation, item.statusCode)))
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
    const pathParams = getParams(schemas.pathParams)
    const pathParamsTyped = getParams(schemas.pathParams, { typed: true })
    let errors: Resolver[] = []

    if (schemas.errors) {
      errors = await this.resolveErrors(schemas.errors?.filter((item) => item.statusCode).map((item) => ({ operation, statusCode: item.statusCode! })))
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
        export function ${hook.name} <TData = ${schemas.response.name}, TError = ${errors.map((error) => error.name).join(' | ') || 'unknown'}>(params?: ${
        schemas.queryParams.name
      }, options?: { query?: SWRConfiguration<TData, TError> }): SWRResponse<TData, TError> {
          const { query: queryOptions } = options ?? {};
          
          const query = useSWR<TData, TError, string>(${new Path(operation.path).template}, {
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
        export function ${hook.name} <TData = ${schemas.response.name}, TError = ${
        errors.map((error) => error.name).join(' | ') || 'unknown'
      }>(${pathParamsTyped} options?: { query?: SWRConfiguration<TData, TError> }): SWRResponse<TData, TError> {
          const { query: queryOptions } = options ?? {};
          
          const query = useSWR<TData, TError, string>(${new Path(operation.path).template}, {
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
        export function ${hook.name} <TData = ${schemas.response.name}, TError = ${
        errors.map((error) => error.name).join(' | ') || 'unknown'
      }>(${pathParamsTyped} params?: ${schemas.queryParams.name}, options?: { query?: SWRConfiguration<TData, TError> }): SWRResponse<TData, TError> {
          const { query: queryOptions } = options ?? {};
          
          const query = useSWR<TData, TError, string>(${new Path(operation.path).template}, {
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
        export function ${hook.name} <TData = ${schemas.response.name}, TError = ${
        errors.map((error) => error.name).join(' | ') || 'unknown'
      }>(options?: { query?: SWRConfiguration<TData, TError> }): SWRResponse<TData, TError> {
          const { query: queryOptions } = options ?? {};

          const query = useSWR<TData, TError, string>(${new Path(operation.path).template}, {
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
          name: [schemas.response.name, schemas.pathParams?.name, schemas.queryParams?.name, ...errors.map((error) => error.name)].filter(Boolean) as string[],
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
    const pathParamsTyped = getParams(schemas.pathParams, { typed: true })
    let errors: Resolver[] = []

    if (schemas.errors) {
      errors = await this.resolveErrors(schemas.errors?.filter((item) => item.statusCode).map((item) => ({ operation, statusCode: item.statusCode! })))
    }

    sources.push(`
        ${createJSDocBlockText({ comments })}
        export function ${hook.name} <TData = ${schemas.response.name}, TError = ${errors.map((error) => error.name).join(' | ') || 'unknown'}, TVariables = ${
      schemas.request.name
    }>(${pathParamsTyped} ${schemas.queryParams?.name ? `params?: ${schemas.queryParams?.name},` : ''} options?: {
          mutation?: SWRMutationConfiguration<TData, TError, TVariables>
        }) {
          const { mutation: mutationOptions } = options ?? {};

          return useSWRMutation<TData, TError, string, TVariables>(
          ${new Path(operation.path).template},
            (url, { arg: data }) => {
              return client<TData, TVariables>({
                method: "post",
                url,
                data,
                ${schemas.queryParams?.name ? 'params,' : ''}
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
          name: [schemas.request.name, schemas.response.name, schemas.pathParams?.name, schemas.queryParams?.name, ...errors.map((error) => error.name)].filter(
            Boolean
          ) as string[],
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
    const pathParamsTyped = getParams(schemas.pathParams, { typed: true })
    let errors: Resolver[] = []
    if (schemas.errors) {
      errors = await this.resolveErrors(schemas.errors?.filter((item) => item.statusCode).map((item) => ({ operation, statusCode: item.statusCode! })))
    }

    sources.push(`
        ${createJSDocBlockText({ comments })}
        export function ${hook.name} <TData = ${schemas.response.name}, TError = ${errors.map((error) => error.name).join(' | ') || 'unknown'}, TVariables = ${
      schemas.request.name
    }>(${pathParamsTyped} ${schemas.queryParams?.name ? `params?: ${schemas.queryParams?.name},` : ''} options?: {
          mutation?: SWRMutationConfiguration<TData, TError, TVariables>
        }) {
          const { mutation: mutationOptions } = options ?? {};

          return useSWRMutation<TData, TError, string, TVariables>(
          ${new Path(operation.path).template},
            (url, { arg: data }) => {
              return client<TData, TVariables>({
                method: "put",
                url,
                data,
                ${schemas.queryParams?.name ? 'params,' : ''}
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
          name: [schemas.request.name, schemas.response.name, schemas.pathParams?.name, schemas.queryParams?.name, ...errors.map((error) => error.name)].filter(
            Boolean
          ) as string[],
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
    const pathParamsTyped = getParams(schemas.pathParams, { typed: true })
    let errors: Resolver[] = []

    if (schemas.errors) {
      errors = await this.resolveErrors(schemas.errors?.filter((item) => item.statusCode).map((item) => ({ operation, statusCode: item.statusCode! })))
    }

    sources.push(`
    ${createJSDocBlockText({ comments })}
    export function ${hook.name} <TData = ${schemas.response.name}, TError = ${errors.map((error) => error.name).join(' | ') || 'unknown'}, TVariables = ${
      schemas.request.name
    }>(${pathParamsTyped} ${schemas.queryParams?.name ? `params?: ${schemas.queryParams?.name},` : ''} options?: {
      mutation?: SWRMutationConfiguration<TData, TError, TVariables>
    }) {
      const { mutation: mutationOptions } = options ?? {};

      return useSWRMutation<TData, TError, string, TVariables>(
      ${new Path(operation.path).template},
        (url, { arg: data }) => {
          return client<TData, TVariables>({
            method: "delete",
            url,
            data,
            ${schemas.queryParams?.name ? 'params,' : ''}
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
          name: [schemas.request.name, schemas.response.name, schemas.pathParams?.name, schemas.queryParams?.name, ...errors.map((error) => error.name)].filter(
            Boolean
          ) as string[],
          path: getRelativePath(hook.filePath, type.filePath),
          isTypeOnly: true,
        },
      ],
    }
  }
}
