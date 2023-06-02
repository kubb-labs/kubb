import { camelCase } from 'change-case'

import type { PluginContext, File, OptionalPath } from '@kubb/core'
import { getRelativePath, createJSDocBlockText } from '@kubb/core'
import { pluginName as swaggerTypescriptPluginName } from '@kubb/swagger-ts'
import { OperationGenerator as Generator, Path, getComments, getParams } from '@kubb/swagger'
import type { Oas, Operation, OperationSchemas, Resolver } from '@kubb/swagger'

import type { ResolvePathOptions } from '../types.ts'

type Options = {
  framework: 'react' | 'solid' | 'svelte' | 'vue'
  clientPath?: OptionalPath
  oas: Oas
  resolvePath: PluginContext<ResolvePathOptions>['resolvePath']
  resolveName: PluginContext['resolveName']
}

export class OperationGenerator extends Generator<Options> {
  resolve(operation: Operation): Resolver {
    const { resolvePath, framework } = this.options

    const imports = this.getFrameworkSpecificImports(framework)

    const name = imports.getName(operation)
    const fileName = `${name}.ts`
    const filePath = resolvePath({
      fileName,
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

  resolveType(operation: Operation): Resolver {
    const { resolvePath, resolveName } = this.options

    const name = resolveName({ name: operation.getOperationId(), pluginName: swaggerTypescriptPluginName })
    const fileName = `${name}.ts`
    const filePath = resolvePath({ fileName, options: { tag: operation.getTags()[0]?.name }, pluginName: swaggerTypescriptPluginName })

    if (!filePath || !name) {
      throw new Error('Filepath should be defined')
    }

    return {
      name,
      fileName,
      filePath,
    }
  }

  resolveError(operation: Operation, statusCode: number): Resolver {
    const { resolvePath, resolveName } = this.options

    const name = resolveName({ name: `${operation.getOperationId()} ${statusCode}`, pluginName: swaggerTypescriptPluginName })
    const fileName = `${name}.ts`
    const filePath = resolvePath({
      fileName,
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

  resolveErrors(items: Array<{ operation: Operation; statusCode: number }>): Resolver[] {
    return items.map((item) => this.resolveError(item.operation, item.statusCode))
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

    const hook = this.resolve(operation)
    const type = this.resolveType(operation)
    const imports = this.getFrameworkSpecificImports(framework)

    const comments = getComments(operation)
    const sources: string[] = []
    const pathParams = getParams(schemas.pathParams)
    const pathParamsTyped = getParams(schemas.pathParams, { typed: true })
    const queryKey = `${camelCase(`${operation.getOperationId()}QueryKey`)}`
    let errors: Resolver[] = []

    if (schemas.errors) {
      errors = this.resolveErrors(schemas.errors?.filter((item) => item.statusCode).map((item) => ({ operation, statusCode: item.statusCode! })))
    }

    const generics = [`TData = ${schemas.response.name}`, `TError = ${errors.map((error) => error.name).join(' | ') || 'unknown'}`].filter(Boolean)
    const clientGenerics = ['TData', 'TError'].filter(Boolean)
    const params = [
      pathParamsTyped,
      schemas.queryParams?.name ? `params?: ${schemas.queryParams.name}` : '',
      `options?: { query?: ${imports.query.UseQueryOptions}<${clientGenerics.join(', ')}> }`,
    ].filter(Boolean)
    const paramsQueryOptions = [pathParamsTyped, schemas.queryParams?.name ? `params?: ${schemas.queryParams.name}` : ''].filter(Boolean)

    if (schemas.queryParams && !schemas.pathParams) {
      sources.push(`
        export const ${queryKey} = (${paramsQueryOptions.join(', ')}) => [${new Path(operation.path).template}, ...(params ? [params] : [])] as const;
      `)

      sources.push(`
        export function ${camelCase(`${operation.getOperationId()}QueryOptions`)} <${generics.join(', ')}>(${paramsQueryOptions.join(', ')}): ${
        imports.query.QueryOptions
      }<${clientGenerics.join(', ')}> {
          const queryKey =${framework === 'solid' ? `() => ${queryKey}(params)` : `${queryKey}(params)`};

          return {
            queryKey,
            queryFn: () => {
              return client<${clientGenerics.join(', ')}>({
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
        export function ${hook.name} <${generics.join(',')}>(${params.join(', ')}): ${imports.query.UseQueryResult}<${clientGenerics.join(
        ', '
      )}> & { queryKey: QueryKey } {
          const { query: queryOptions } = options ?? {};
          const queryKey = queryOptions?.queryKey${framework === 'solid' ? `?.()` : ''} ?? ${queryKey}(params);
          
          const query = ${imports.query.useQuery}<${clientGenerics.join(', ')}>({
            ...${camelCase(`${operation.getOperationId()}QueryOptions`)}<${clientGenerics.join(', ')}>(params),
            ...queryOptions
          }) as ${imports.query.UseQueryResult}<${clientGenerics.join(', ')}> & { queryKey: QueryKey };

          query.queryKey = queryKey as QueryKey;

          return query;
        };
      `)
    }

    if (!schemas.queryParams && schemas.pathParams) {
      sources.push(`
        export const ${queryKey} = (${paramsQueryOptions.join(', ')}) => [${new Path(operation.path).template}] as const;
      `)

      sources.push(`
        export function ${camelCase(`${operation.getOperationId()}QueryOptions`)} <${generics.join(', ')}>(${paramsQueryOptions.join(', ')}): ${
        imports.query.QueryOptions
      }<${clientGenerics.join(', ')}> {
          const queryKey =${framework === 'solid' ? `() => ${queryKey}(${pathParams})` : `${queryKey}(${pathParams})`};

          return {
            queryKey,
            queryFn: () => {
              return client<${clientGenerics.join(', ')}>({
                method: "get",
                url: ${new Path(operation.path).template}
              });
            },
          };
        };
      `)

      sources.push(`
        ${createJSDocBlockText({ comments })}
        export function ${hook.name} <${generics.join(', ')}>(${params.join(', ')}): ${imports.query.UseQueryResult}<${clientGenerics.join(
        ', '
      )}> & { queryKey: QueryKey } {
          const { query: queryOptions } = options ?? {};
          const queryKey = queryOptions?.queryKey${framework === 'solid' ? `?.()` : ''} ?? ${queryKey}(${pathParams});
          
          const query = ${imports.query.useQuery}<${clientGenerics.join(', ')}>({
            ...${camelCase(`${operation.getOperationId()}QueryOptions`)}<${clientGenerics.join(', ')}>(${pathParams}),
            ...queryOptions
          }) as ${imports.query.UseQueryResult}<${clientGenerics.join(', ')}> & { queryKey: QueryKey };

          query.queryKey = queryKey as QueryKey;

          return query;
        };
      `)
    }

    if (schemas.queryParams && schemas.pathParams) {
      sources.push(`
        export const ${queryKey} = (${paramsQueryOptions.join(', ')}) => [${new Path(operation.path).template}, ...(params ? [params] : [])] as const;
      `)

      sources.push(`
        export function ${camelCase(`${operation.getOperationId()}QueryOptions`)} <${generics.join(', ')}>(${paramsQueryOptions.join(', ')}): ${
        imports.query.QueryOptions
      }<${clientGenerics.join(', ')}> {
          const queryKey =${framework === 'solid' ? `() => ${queryKey}(${pathParams}, params)` : `${queryKey}(${pathParams}, params)`};

          return {
            queryKey,
            queryFn: () => {
              return client<${clientGenerics.join(', ')}>({
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
        export function ${hook.name} <${generics.join(', ')}>(${params.join(', ')}): ${imports.query.UseQueryResult}<${clientGenerics.join(
        ', '
      )}> & { queryKey: QueryKey } {
          const { query: queryOptions } = options ?? {};
          const queryKey = queryOptions?.queryKey${framework === 'solid' ? `?.()` : ''} ?? ${queryKey}(${pathParams}, params);
          
          const query = ${imports.query.useQuery}<${clientGenerics.join(', ')}>({
            ...${camelCase(`${operation.getOperationId()}QueryOptions`)}<${clientGenerics.join(', ')}>(${pathParams}, params),
            ...queryOptions
          }) as ${imports.query.UseQueryResult}<${clientGenerics.join(', ')}> & { queryKey: QueryKey };

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
      export function ${camelCase(`${operation.getOperationId()}QueryOptions`)} <${generics.join(', ')}>(): ${imports.query.QueryOptions}<${clientGenerics.join(
        ', '
      )}> {
        const queryKey =${framework === 'solid' ? `() => ${queryKey}()` : `${queryKey}()`};

        return {
          queryKey,
          queryFn: () => {
            return client<${clientGenerics.join(', ')}>({
              method: "get",
              url: ${new Path(operation.path).template}
            });
          },
        };
      };
    `)

      sources.push(`
        ${createJSDocBlockText({ comments })}
        export function ${hook.name} <${generics.join(', ')}>(${params.join(', ')}): ${imports.query.UseQueryResult}<${clientGenerics.join(
        ', '
      )}> & { queryKey: QueryKey } {
          const { query: queryOptions } = options ?? {};
          const queryKey = queryOptions?.queryKey${framework === 'solid' ? `?.()` : ''} ?? ${queryKey}();

          const query = ${imports.query.useQuery}<${clientGenerics.join(', ')}>({
            ...${camelCase(`${operation.getOperationId()}QueryOptions`)}<${clientGenerics.join(', ')}>(),
            ...queryOptions
          }) as ${imports.query.UseQueryResult}<${clientGenerics.join(', ')}> & { queryKey: QueryKey };

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

    const hook = this.resolve(operation)
    const type = this.resolveType(operation)
    const imports = this.getFrameworkSpecificImports(framework)

    const comments = getComments(operation)
    const pathParamsTyped = getParams(schemas.pathParams, { typed: true })
    let errors: Resolver[] = []

    if (schemas.errors) {
      errors = this.resolveErrors(schemas.errors?.filter((item) => item.statusCode).map((item) => ({ operation, statusCode: item.statusCode! })))
    }
    const generics = [
      `TData = ${schemas.response.name}`,
      `TError = ${errors.map((error) => error.name).join(' | ') || 'unknown'}`,
      schemas.request?.name ? `TVariables = ${schemas.request?.name}` : '',
    ].filter(Boolean)
    const clientGenerics = ['TData', 'TError', schemas.request?.name ? `TVariables` : ''].filter(Boolean)
    const params = [
      pathParamsTyped,
      schemas.queryParams?.name ? `params?: ${schemas.queryParams?.name}` : '',
      `options?: {
        mutation?: ${imports.mutate.UseMutationOptions}<${clientGenerics.join(', ')}>
    }`,
    ].filter(Boolean)

    const source = `
        ${createJSDocBlockText({ comments })}
        export function ${hook.name} <${generics.join(', ')}>(${params.join(', ')}) {
          const { mutation: mutationOptions } = options ?? {};

          return ${imports.mutate.useMutation}<${clientGenerics.join(', ')}>({
            mutationFn: (${schemas.request?.name ? 'data' : ''}) => {
              return client<${clientGenerics.join(', ')}>({
                method: "post",
                url: ${new Path(operation.path).template},
                ${schemas.request?.name ? 'data,' : ''}
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
          name: [
            schemas.request?.name,
            schemas.response.name,
            schemas.pathParams?.name,
            schemas.queryParams?.name,
            ...errors.map((error) => error.name),
          ].filter(Boolean) as string[],
          path: getRelativePath(hook.filePath, type.filePath),
          isTypeOnly: true,
        },
      ],
    }
  }

  async put(operation: Operation, schemas: OperationSchemas): Promise<File | null> {
    const { clientPath, framework } = this.options

    const hook = this.resolve(operation)
    const type = this.resolveType(operation)
    const imports = this.getFrameworkSpecificImports(framework)

    const comments = getComments(operation)
    const pathParamsTyped = getParams(schemas.pathParams, { typed: true })
    let errors: Resolver[] = []

    if (schemas.errors) {
      errors = this.resolveErrors(schemas.errors?.filter((item) => item.statusCode).map((item) => ({ operation, statusCode: item.statusCode! })))
    }

    const generics = [
      `TData = ${schemas.response.name}`,
      `TError = ${errors.map((error) => error.name).join(' | ') || 'unknown'}`,
      schemas.request?.name ? `TVariables = ${schemas.request?.name}` : '',
    ].filter(Boolean)
    const clientGenerics = ['TData', 'TError', schemas.request?.name ? `TVariables` : ''].filter(Boolean)
    const params = [
      pathParamsTyped,
      schemas.queryParams?.name ? `params?: ${schemas.queryParams?.name}` : '',
      `options?: {
        mutation?: ${imports.mutate.UseMutationOptions}<${clientGenerics.join(', ')}>
    }`,
    ].filter(Boolean)

    const source = `
        ${createJSDocBlockText({ comments })}
        export function ${hook.name} <${generics.join(', ')}>(${params.join(', ')}) {
          const { mutation: mutationOptions } = options ?? {};

          return ${imports.mutate.useMutation}<${clientGenerics.join(', ')}>({
            mutationFn: (${schemas.request?.name ? 'data' : ''}) => {
              return client<${clientGenerics.join(', ')}>({
                method: "put",
                url: ${new Path(operation.path).template},
                ${schemas.request?.name ? 'data,' : ''}
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
          name: [
            schemas.request?.name,
            schemas.response.name,
            schemas.pathParams?.name,
            schemas.queryParams?.name,
            ...errors.map((error) => error.name),
          ].filter(Boolean) as string[],
          path: getRelativePath(hook.filePath, type.filePath),
          isTypeOnly: true,
        },
      ],
    }

    // end hook creation
  }

  async delete(operation: Operation, schemas: OperationSchemas): Promise<File | null> {
    const { clientPath, framework } = this.options

    const hook = this.resolve(operation)
    const type = this.resolveType(operation)
    const imports = this.getFrameworkSpecificImports(framework)

    const comments = getComments(operation)
    const pathParamsTyped = getParams(schemas.pathParams, { typed: true })
    let errors: Resolver[] = []

    if (schemas.errors) {
      errors = this.resolveErrors(schemas.errors?.filter((item) => item.statusCode).map((item) => ({ operation, statusCode: item.statusCode! })))
    }

    const generics = [
      `TData = ${schemas.response.name}`,
      `TError = ${errors.map((error) => error.name).join(' | ') || 'unknown'}`,
      schemas.request?.name ? `TVariables = ${schemas.request?.name}` : '',
    ].filter(Boolean)
    const clientGenerics = ['TData', 'TError', schemas.request?.name ? `TVariables` : ''].filter(Boolean)
    const params = [
      pathParamsTyped,
      schemas.queryParams?.name ? `params?: ${schemas.queryParams?.name}` : '',
      `options?: {
        mutation?: ${imports.mutate.UseMutationOptions}<${clientGenerics.join(', ')}>
    }`,
    ].filter(Boolean)

    const source = `
        ${createJSDocBlockText({ comments })}
        export function ${hook.name} <${generics.join(', ')}>(${params.join(', ')}) {
          const { mutation: mutationOptions } = options ?? {};

          return ${imports.mutate.useMutation}<${clientGenerics.join(', ')}>({
            mutationFn: (${schemas.request?.name ? 'data' : ''}) => {
              return client<${clientGenerics.join(', ')}>({
                method: "delete",
                url: ${new Path(operation.path).template},
                ${schemas.request?.name ? 'data,' : ''}
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
          name: [
            schemas.request?.name,
            schemas.response.name,
            schemas.pathParams?.name,
            schemas.queryParams?.name,
            ...errors.map((error) => error.name),
          ].filter(Boolean) as string[],
          path: getRelativePath(hook.filePath, type.filePath),
          isTypeOnly: true,
        },
      ],
    }
  }
}
