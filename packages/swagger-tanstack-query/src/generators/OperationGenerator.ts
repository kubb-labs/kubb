import { camelCase } from 'change-case'

import type { PluginContext, File, FileManager, OptionalPath } from '@kubb/core'
import { getRelativePath, createJSDocBlockText } from '@kubb/core'
import { pluginName as swaggerTypescriptPluginName } from '@kubb/swagger-ts'
import { OperationGenerator as Generator, Path, getComments, getParams } from '@kubb/swagger'
import type { Oas, Operation, OperationSchemas, Resolver } from '@kubb/swagger'

import type { ResolvePathOptions } from '../types'

type Options = {
  framework: 'react' | 'solid' | 'svelte' | 'vue'
  clientPath?: OptionalPath
  oas: Oas
  directory: string
  fileManager: FileManager
  resolvePath: PluginContext<ResolvePathOptions>['resolvePath']
  resolveName: PluginContext['resolveName']
}

export class OperationGenerator extends Generator<Options> {
  async resolve(operation: Operation): Promise<Resolver> {
    const { directory, resolvePath, framework } = this.options

    const imports = this.getFrameworkSpecificImports(framework)

    const name = imports.getName(operation)
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

  getFrameworkSpecificImports(framework: Options['framework']): {
    getName: (operation: Operation) => string
    query: {
      useQuery: string
      QueryKey: string
      UseQueryResult: string
      UseQueryOptions: string
      QueryOptions: string
    }
    mutate: {
      useMutation: string
      UseMutationOptions: string
    }
  } {
    const { resolveName } = this.options

    if (framework === 'svelte') {
      return {
        getName: (operation) => resolveName({ name: `${operation.getOperationId()} query` })!,
        query: {
          useQuery: 'createQuery',
          QueryKey: 'QueryKey',
          UseQueryResult: 'CreateQueryResult',
          UseQueryOptions: 'CreateQueryOptions',
          QueryOptions: 'CreateQueryOptions',
        },
        mutate: {
          useMutation: 'createMutation',
          UseMutationOptions: 'CreateMutationOptions',
        },
      }
    }

    if (framework === 'solid') {
      return {
        getName: (operation) => resolveName({ name: `${operation.getOperationId()} query` })!,
        query: {
          useQuery: 'createQuery',
          QueryKey: 'QueryKey',
          UseQueryResult: 'CreateQueryResult',
          UseQueryOptions: 'CreateQueryOptions',
          QueryOptions: 'CreateQueryOptions',
        },
        mutate: {
          useMutation: 'createMutation',
          UseMutationOptions: 'CreateMutationOptions',
        },
      }
    }

    if (framework === 'vue') {
      return {
        getName: (operation) => resolveName({ name: `use ${operation.getOperationId()}` })!,
        query: {
          useQuery: 'useQuery',
          QueryKey: 'QueryKey',
          UseQueryResult: 'UseQueryReturnType',
          UseQueryOptions: 'UseQueryOptions',
          QueryOptions: 'QueryOptions',
        },
        mutate: {
          useMutation: 'useMutation',
          UseMutationOptions: 'VueMutationObserverOptions',
        },
      }
    }

    return {
      getName: (operation) => resolveName({ name: `use ${operation.getOperationId()}` })!,
      query: {
        useQuery: 'useQuery',
        QueryKey: 'QueryKey',
        UseQueryResult: 'UseQueryResult',
        UseQueryOptions: 'UseQueryOptions',
        QueryOptions: 'QueryOptions',
      },
      mutate: {
        useMutation: 'useMutation',
        UseMutationOptions: 'UseMutationOptions',
      },
    }
  }

  getQueryImports(type: 'query' | 'mutate'): Required<File>['imports'] {
    const { framework } = this.options

    if (framework === 'svelte') {
      return [
        {
          name: Object.values(this.getFrameworkSpecificImports('svelte')[type]),
          path: '@tanstack/svelte-query',
        },
      ]
    }

    if (framework === 'solid') {
      return [
        {
          name: Object.values(this.getFrameworkSpecificImports('solid')[type]),
          path: '@tanstack/solid-query',
        },
      ]
    }

    if (framework === 'vue') {
      return [
        {
          name: ['VueMutationObserverOptions'],
          path: '@tanstack/vue-query/build/lib/useMutation',
          isTypeOnly: true,
        },
        {
          name: Object.values(this.getFrameworkSpecificImports('vue')[type]).filter((item) => item !== 'VueMutationObserverOptions'),
          path: '@tanstack/vue-query',
        },
      ]
    }

    return [
      {
        name: Object.values(this.getFrameworkSpecificImports('react')[type]),
        path: '@tanstack/react-query',
      },
    ]
  }

  async all(): Promise<File | null> {
    return null
  }

  async get(operation: Operation, schemas: OperationSchemas): Promise<File | null> {
    const { clientPath, framework } = this.options

    const hook = await this.resolve(operation)
    const type = await this.resolveType(operation)
    const imports = this.getFrameworkSpecificImports(framework)

    const comments = getComments(operation)
    const sources: string[] = []
    const pathParams = getParams(schemas.pathParams)
    const pathParamsTyped = getParams(schemas.pathParams, { typed: true })
    const queryKey = `${camelCase(`${operation.getOperationId()}QueryKey`)}`
    let errors: Resolver[] = []

    if (schemas.errors) {
      errors = await this.resolveErrors(schemas.errors?.filter((item) => item.statusCode).map((item) => ({ operation, statusCode: item.statusCode! })))
    }

    if (schemas.queryParams && !schemas.pathParams) {
      sources.push(`
        export const ${queryKey} = (params?: ${schemas.queryParams.name}) => [${new Path(operation.path).template}, ...(params ? [params] : [])] as const;
      `)

      sources.push(`
        export function ${camelCase(`${operation.getOperationId()}QueryOptions`)} <TData = ${schemas.response.name}>(params?: ${schemas.queryParams.name}): ${
        imports.query.QueryOptions
      }<TData> {
          const queryKey =${framework === 'solid' ? `() => ${queryKey}(params)` : `${queryKey}(params)`};

          return {
            queryKey,
            queryFn: () => {
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
        export function ${hook.name} <TData = ${schemas.response.name}, TError = ${errors.map((error) => error.name).join(' &') || 'unknown'}>(params?: ${
        schemas.queryParams.name
      }, options?: { query?: ${imports.query.UseQueryOptions}<TData> }): ${imports.query.UseQueryResult}<TData, TError> & { queryKey: QueryKey } {
          const { query: queryOptions } = options ?? {};
          const queryKey = queryOptions?.queryKey${framework === 'solid' ? `?.()` : ''} ?? ${queryKey}(params);
          
          const query = ${imports.query.useQuery}<TData, TError>({
            ...${camelCase(`${operation.getOperationId()}QueryOptions`)}<TData>(params),
            ...queryOptions
          }) as ${imports.query.UseQueryResult}<TData, TError> & { queryKey: QueryKey };

          query.queryKey = queryKey as QueryKey;

          return query;
        };
      `)
    }

    if (!schemas.queryParams && schemas.pathParams) {
      sources.push(`
        export const ${queryKey} = (${pathParamsTyped}) => [${new Path(operation.path).template}] as const;
      `)

      sources.push(`
        export function ${camelCase(`${operation.getOperationId()}QueryOptions`)} <TData = ${schemas.response.name}>(${pathParamsTyped}): ${
        imports.query.QueryOptions
      }<TData> {
          const queryKey =${framework === 'solid' ? `() => ${queryKey}(${pathParams})` : `${queryKey}(${pathParams})`};

          return {
            queryKey,
            queryFn: () => {
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
        errors.map((error) => error.name).join(' &') || 'unknown'
      }>(${pathParamsTyped} options?: { query?: ${imports.query.UseQueryOptions}<TData> }): ${
        imports.query.UseQueryResult
      }<TData, TError> & { queryKey: QueryKey } {
          const { query: queryOptions } = options ?? {};
          const queryKey = queryOptions?.queryKey${framework === 'solid' ? `?.()` : ''} ?? ${queryKey}(${pathParams});
          
          const query = ${imports.query.useQuery}<TData, TError>({
            ...${camelCase(`${operation.getOperationId()}QueryOptions`)}<TData>(${pathParams}),
            ...queryOptions
          }) as ${imports.query.UseQueryResult}<TData, TError> & { queryKey: QueryKey };

          query.queryKey = queryKey as QueryKey;

          return query;
        };
      `)
    }

    if (schemas.queryParams && schemas.pathParams) {
      sources.push(`
        export const ${queryKey} = (${pathParamsTyped} params?: ${schemas.queryParams.name}) => [${
        new Path(operation.path).template
      }, ...(params ? [params] : [])] as const;
      `)

      sources.push(`
        export function ${camelCase(`${operation.getOperationId()}QueryOptions`)} <TData = ${schemas.response.name}>(${pathParamsTyped} params?: ${
        schemas.queryParams.name
      }): ${imports.query.QueryOptions}<TData> {
          const queryKey =${framework === 'solid' ? `() => ${queryKey}(${pathParams} params)` : `${queryKey}(${pathParams} params)`};

          return {
            queryKey,
            queryFn: () => {
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
        errors.map((error) => error.name).join(' &') || 'unknown'
      }>(${pathParamsTyped} params?: ${schemas.queryParams.name}, options?: { query?: ${imports.query.UseQueryOptions}<TData> }): ${
        imports.query.UseQueryResult
      }<TData, TError> & { queryKey: QueryKey } {
          const { query: queryOptions } = options ?? {};
          const queryKey = queryOptions?.queryKey${framework === 'solid' ? `?.()` : ''} ?? ${queryKey}(${pathParams} params);
          
          const query = ${imports.query.useQuery}<TData, TError>({
            ...${camelCase(`${operation.getOperationId()}QueryOptions`)}<TData>(${pathParams} params),
            ...queryOptions
          }) as ${imports.query.UseQueryResult}<TData, TError> & { queryKey: QueryKey };

          query.queryKey = queryKey as QueryKey;

          return query;
        };
      `)
    }

    if (!schemas.queryParams && !schemas.pathParams) {
      sources.push(`
        export const ${queryKey} = () => [${new Path(operation.path).template}] as const;
      `)

      sources.push(`
      export function ${camelCase(`${operation.getOperationId()}QueryOptions`)} <TData = ${schemas.response.name}>(): ${imports.query.QueryOptions}<TData> {
        const queryKey =${framework === 'solid' ? `() => ${queryKey}()` : `${queryKey}()`};

        return {
          queryKey,
          queryFn: () => {
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
        errors.map((error) => error.name).join(' &') || 'unknown'
      }>(options?: { query?: ${imports.query.UseQueryOptions}<TData> }): ${imports.query.UseQueryResult}<TData, unknown> & { queryKey: QueryKey } {
          const { query: queryOptions } = options ?? {};
          const queryKey = queryOptions?.queryKey${framework === 'solid' ? `?.()` : ''} ?? ${queryKey}();

          const query = ${imports.query.useQuery}<TData, TError>({
            ...${camelCase(`${operation.getOperationId()}QueryOptions`)}<TData>(),
            ...queryOptions
          }) as ${imports.query.UseQueryResult}<TData, TError> & { queryKey: QueryKey };

          query.queryKey = queryKey as QueryKey;

          return query;
        };
      `)
    }

    return {
      path: hook.filePath,
      fileName: hook.fileName,
      source: sources.join('\n'),
      imports: [
        ...this.getQueryImports('query'),
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
    const { clientPath, framework } = this.options

    const hook = await this.resolve(operation)
    const type = await this.resolveType(operation)
    const imports = this.getFrameworkSpecificImports(framework)

    const comments = getComments(operation)
    const pathParamsTyped = getParams(schemas.pathParams, { typed: true })
    let errors: Resolver[] = []

    if (schemas.errors) {
      errors = await this.resolveErrors(schemas.errors?.filter((item) => item.statusCode).map((item) => ({ operation, statusCode: item.statusCode! })))
    }

    const source = `
        ${createJSDocBlockText({ comments })}
        export function ${hook.name} <TData = ${schemas.response.name}, TError = ${errors.map((error) => error.name).join(' &') || 'unknown'}, TVariables = ${
      schemas.request.name
    }>(${pathParamsTyped} ${schemas.queryParams?.name ? `params?: ${schemas.queryParams?.name},` : ''} options?: {
          mutation?: ${imports.mutate.UseMutationOptions}<TData, TError, TVariables>
        }) {
          const { mutation: mutationOptions } = options ?? {};

          return ${imports.mutate.useMutation}<TData, TError, TVariables>({
            mutationFn: (data) => {
              return client<TData, TVariables>({
                method: "post",
                url: ${new Path(operation.path).template},
                data,
                ${schemas.queryParams?.name ? 'params,' : ''}
              });
            },
            ...mutationOptions
          });
        };
    `

    return {
      path: hook.filePath,
      fileName: hook.fileName,
      source,
      imports: [
        ...this.getQueryImports('mutate'),
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
    const { clientPath, framework } = this.options

    const hook = await this.resolve(operation)
    const type = await this.resolveType(operation)
    const imports = this.getFrameworkSpecificImports(framework)

    const comments = getComments(operation)
    const pathParamsTyped = getParams(schemas.pathParams, { typed: true })
    let errors: Resolver[] = []

    if (schemas.errors) {
      errors = await this.resolveErrors(schemas.errors?.filter((item) => item.statusCode).map((item) => ({ operation, statusCode: item.statusCode! })))
    }

    const source = `
        ${createJSDocBlockText({ comments })}
        export function ${hook.name} <TData = ${schemas.response.name}, TError = ${errors.map((error) => error.name).join(' &') || 'unknown'}, TVariables = ${
      schemas.request.name
    }>(${pathParamsTyped} ${schemas.queryParams?.name ? `params?: ${schemas.queryParams?.name},` : ''} options?: {
          mutation?: ${imports.mutate.UseMutationOptions}<TData, TError, TVariables>
        }) {
          const { mutation: mutationOptions } = options ?? {};

          return ${imports.mutate.useMutation}<TData, TError, TVariables>({
            mutationFn: (data) => {
              return client<TData, TVariables>({
                method: "put",
                url: ${new Path(operation.path).template},
                data,
                ${schemas.queryParams?.name ? 'params,' : ''}
              });
            },
            ...mutationOptions
          });
        };
    `

    return {
      path: hook.filePath,
      fileName: hook.fileName,
      source,
      imports: [
        ...this.getQueryImports('mutate'),
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

    // end hook creation
  }

  async delete(operation: Operation, schemas: OperationSchemas): Promise<File | null> {
    const { clientPath, framework } = this.options

    const hook = await this.resolve(operation)
    const type = await this.resolveType(operation)
    const imports = this.getFrameworkSpecificImports(framework)

    const comments = getComments(operation)
    const pathParamsTyped = getParams(schemas.pathParams, { typed: true })
    let errors: Resolver[] = []

    if (schemas.errors) {
      errors = await this.resolveErrors(schemas.errors?.filter((item) => item.statusCode).map((item) => ({ operation, statusCode: item.statusCode! })))
    }

    const source = `
        ${createJSDocBlockText({ comments })}
        export function ${hook.name} <TData = ${schemas.response.name}, TError = ${errors.map((error) => error.name).join(' &') || 'unknown'}, TVariables = ${
      schemas.request.name
    }>(${pathParamsTyped} ${schemas.queryParams?.name ? `params?: ${schemas.queryParams?.name},` : ''} options?: {
          mutation?: ${imports.mutate.UseMutationOptions}<TData, TError, TVariables>
        }) {
          const { mutation: mutationOptions } = options ?? {};

          return ${imports.mutate.useMutation}<TData, TError, TVariables>({
            mutationFn: (data) => {
              return client<TData, TVariables>({
                method: "delete",
                url: ${new Path(operation.path).template},
                data,
                ${schemas.queryParams?.name ? 'params,' : ''}
              });
            },
            ...mutationOptions
          });
        };
    `

    return {
      path: hook.filePath,
      fileName: hook.fileName,
      source,
      imports: [
        ...this.getQueryImports('mutate'),
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
