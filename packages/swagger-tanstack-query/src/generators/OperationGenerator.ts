import { camelCase } from 'change-case'

import type { PluginContext, File, FileManager, OptionalPath } from '@kubb/core'
import { getRelativePath, objectToParameters, createJSDocBlockText } from '@kubb/core'
import { pluginName as swaggerTypescriptPluginName } from '@kubb/swagger-ts'
import { OperationGenerator as Generator, Path, getComments } from '@kubb/swagger'
import type { Oas, Operation, OperationSchemas } from '@kubb/swagger'

import { pluginName } from '../plugin'

import type { resolvePathOptions } from '../types'

type Options = {
  framework: 'react' | 'solid' | 'svelte' | 'vue'
  clientPath?: OptionalPath
  oas: Oas
  directory: string
  fileManager: FileManager
  resolvePath: PluginContext<resolvePathOptions>['resolvePath']
  resolveName: PluginContext['resolveName']
}

export class OperationGenerator extends Generator<Options> {
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
        getName: (operation) => resolveName({ name: `${operation.getOperationId()} query`, pluginName })!,
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
        getName: (operation) => resolveName({ name: `${operation.getOperationId()} query`, pluginName })!,
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
        getName: (operation) => resolveName({ name: `use ${operation.getOperationId()}`, pluginName })!,
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
      getName: (operation) => resolveName({ name: `use ${operation.getOperationId()}`, pluginName })!,
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
    const { directory, resolvePath, resolveName, clientPath, framework } = this.options

    // hook setup
    const imports = this.getFrameworkSpecificImports(framework)
    const hookName = imports.getName(operation)
    const hookId = `${hookName}.ts`
    const hookFilePath = await resolvePath({
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

    const typeName = `${resolveName({ name: operation.getOperationId(), pluginName: swaggerTypescriptPluginName })}.ts`
    const typeFilePath = await resolvePath({ fileName: typeName, directory, pluginName: swaggerTypescriptPluginName })

    // hook creation

    const comments = getComments(operation)
    const sources: string[] = []
    const queryKey = `${camelCase(`${operation.getOperationId()}QueryKey`)}`
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
        export function ${hookName} <TData = ${schemas.response.name}>(params?: ${schemas.queryParams.name}, options?: { query?: ${
        imports.query.UseQueryOptions
      }<TData> }): ${imports.query.UseQueryResult}<TData, unknown> & { queryKey: QueryKey } {
          const { query: queryOptions } = options ?? {};
          const queryKey = queryOptions?.queryKey${framework === 'solid' ? `?.()` : ''} ?? ${queryKey}(params);
          
          const query = ${imports.query.useQuery}<TData>({
            ...${camelCase(`${operation.getOperationId()}QueryOptions`)}<TData>(params),
            ...queryOptions
          }) as ${imports.query.UseQueryResult}<TData, unknown> & { queryKey: QueryKey };

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
        export function ${hookName} <TData = ${schemas.response.name}>(${pathParamsTyped} options?: { query?: ${imports.query.UseQueryOptions}<TData> }): ${
        imports.query.UseQueryResult
      }<TData, unknown> & { queryKey: QueryKey } {
          const { query: queryOptions } = options ?? {};
          const queryKey = queryOptions?.queryKey${framework === 'solid' ? `?.()` : ''} ?? ${queryKey}(${pathParams});
          
          const query = ${imports.query.useQuery}<TData>({
            ...${camelCase(`${operation.getOperationId()}QueryOptions`)}<TData>(${pathParams}),
            ...queryOptions
          }) as ${imports.query.UseQueryResult}<TData, unknown> & { queryKey: QueryKey };

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
        export function ${hookName} <TData = ${schemas.response.name}>(${pathParamsTyped} params?: ${schemas.queryParams.name}, options?: { query?: ${
        imports.query.UseQueryOptions
      }<TData> }): ${imports.query.UseQueryResult}<TData, unknown> & { queryKey: QueryKey } {
          const { query: queryOptions } = options ?? {};
          const queryKey = queryOptions?.queryKey${framework === 'solid' ? `?.()` : ''} ?? ${queryKey}(${pathParams} params);
          
          const query = ${imports.query.useQuery}<TData>({
            ...${camelCase(`${operation.getOperationId()}QueryOptions`)}<TData>(${pathParams} params),
            ...queryOptions
          }) as ${imports.query.UseQueryResult}<TData, unknown> & { queryKey: QueryKey };

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
        export function ${hookName} <TData = ${schemas.response.name}>(options?: { query?: ${imports.query.UseQueryOptions}<TData> }): ${
        imports.query.UseQueryResult
      }<TData, unknown> & { queryKey: QueryKey } {
          const { query: queryOptions } = options ?? {};
          const queryKey = queryOptions?.queryKey${framework === 'solid' ? `?.()` : ''} ?? ${queryKey}();

          const query = ${imports.query.useQuery}<TData>({
            ...${camelCase(`${operation.getOperationId()}QueryOptions`)}<TData>(),
            ...queryOptions
          }) as ${imports.query.UseQueryResult}<TData, unknown> & { queryKey: QueryKey };

          query.queryKey = queryKey as QueryKey;

          return query;
        };
      `)
    }

    return {
      path: hookFilePath,
      fileName: hookId,
      source: sources.join('\n'),
      imports: [
        ...this.getQueryImports('query'),
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
    const { directory, resolvePath, resolveName, clientPath, framework } = this.options

    // hook setup
    const imports = this.getFrameworkSpecificImports(framework)
    const hookName = imports.getName(operation)
    const hookId = `${hookName}.ts`
    const hookFilePath = await resolvePath({ fileName: hookId, directory, pluginName, options: { tag: operation.getTags()[0]?.name } })
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
          mutation?: ${imports.mutate.UseMutationOptions}<TData, unknown, TVariables>
        }) {
          const { mutation: mutationOptions } = options ?? {};

          return ${imports.mutate.useMutation}<TData, unknown, TVariables>({
            mutationFn: (data) => {
              return client<TData, TVariables>({
                method: "post",
                url: ${new Path(operation.path).template},
                data,
              });
            },
            ...mutationOptions
          });
        };
    `

    return {
      path: hookFilePath,
      fileName: hookId,
      source,
      imports: [
        ...this.getQueryImports('mutate'),
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
    const { directory, resolvePath, resolveName, clientPath, framework } = this.options

    // hook setup
    const imports = this.getFrameworkSpecificImports(framework)
    const hookName = imports.getName(operation)
    const hookId = `${hookName}.ts`
    const hookFilePath = await resolvePath({ fileName: hookId, directory, pluginName, options: { tag: operation.getTags()[0]?.name } })
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
          mutation?:  ${imports.mutate.UseMutationOptions}<TData, unknown, TVariables>
        }) {
          const { mutation: mutationOptions } = options ?? {};

          return ${imports.mutate.useMutation}<TData, unknown, TVariables>({
            mutationFn: (data) => {
              return client<TData, TVariables>({
                method: "put",
                url: ${new Path(operation.path).template},
                data
              });
            },
            ...mutationOptions
          });
        };
    `

    return {
      path: hookFilePath,
      fileName: hookId,
      source,
      imports: [
        ...this.getQueryImports('mutate'),
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
    const { directory, resolvePath, resolveName, clientPath, framework } = this.options

    // hook setup
    const imports = this.getFrameworkSpecificImports(framework)
    const hookName = imports.getName(operation)
    const hookId = `${hookName}.ts`
    const hookFilePath = await resolvePath({ fileName: hookId, directory, pluginName, options: { tag: operation.getTags()[0]?.name } })
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
          mutation?:  ${imports.mutate.UseMutationOptions}<TData, unknown, TVariables>
        }) {
          const { mutation: mutationOptions } = options ?? {};

          return ${imports.mutate.useMutation}<TData, unknown, TVariables>({
            mutationFn: () => {
              return client<TData, TVariables>({
                method: "delete",
                url: ${new Path(operation.path).template}
              });
            },
            ...mutationOptions
          });
        };
    `

    return {
      path: hookFilePath,
      fileName: hookId,
      source,
      imports: [
        ...this.getQueryImports('mutate'),
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
