import { createJSDocBlockText, getRelativePath, URLPath } from '@kubb/core'
import { OperationGenerator as Generator, getComments, getParams } from '@kubb/swagger'
import { pluginName as swaggerTypescriptPluginName } from '@kubb/swagger-ts'

import { camelCase } from 'change-case'

import type { File, OptionalPath, PluginContext } from '@kubb/core'
import type { Oas, Operation, OperationSchemas, Resolver } from '@kubb/swagger'
import type { ResolvePathOptions } from '../types.ts'

type Options = {
  framework: 'react' | 'solid' | 'svelte' | 'vue'
  clientPath?: OptionalPath
  oas: Oas
  resolvePath: PluginContext<ResolvePathOptions>['resolvePath']
  resolveName: PluginContext['resolveName']
  /**
   * Only used of infinite
   */
  queryParam?: string
}

export class OperationGenerator extends Generator<Options> {
  resolve(operation: Operation): Resolver {
    const { resolvePath, framework } = this.options

    const imports = this.getFrameworkSpecificImports(framework)

    const name = imports.getName(operation)

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

  resolveError(operation: Operation, statusCode: number): Resolver {
    const { resolvePath, resolveName } = this.options

    const name = resolveName({ name: `${operation.getOperationId()} ${statusCode}`, pluginName: swaggerTypescriptPluginName })

    if (!name) {
      throw new Error('Name should be defined')
    }

    const fileName = `${name}.ts`
    const filePath = resolvePath({
      fileName,
      options: { tag: operation.getTags()[0]?.name },
      pluginName: swaggerTypescriptPluginName,
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
      //infinite
      UseInfiniteQueryOptions: string
      UseInfiniteQueryResult: string
      useInfiniteQuery: string
    }
    mutate: {
      useMutation: string
      UseMutationOptions: string
    }
  } {
    const { resolveName } = this.options

    if (framework === 'svelte') {
      return {
        getName: (operation) => resolveName({ name: `${operation.getOperationId()} query` }),
        query: {
          useQuery: 'createQuery',
          QueryKey: 'QueryKey',
          UseQueryResult: 'CreateQueryResult',
          UseQueryOptions: 'CreateQueryOptions',
          QueryOptions: 'CreateQueryOptions',
          UseInfiniteQueryOptions: 'CreateInfiniteQueryOptions',
          UseInfiniteQueryResult: 'CreateInfiniteQueryResult',
          useInfiniteQuery: 'createInfiniteQuery',
        },
        mutate: {
          useMutation: 'createMutation',
          UseMutationOptions: 'CreateMutationOptions',
        },
      }
    }

    if (framework === 'solid') {
      return {
        getName: (operation) => resolveName({ name: `${operation.getOperationId()} query` }),
        query: {
          useQuery: 'createQuery',
          QueryKey: 'QueryKey',
          UseQueryResult: 'CreateQueryResult',
          UseQueryOptions: 'CreateQueryOptions',
          QueryOptions: 'CreateQueryOptions',
          UseInfiniteQueryOptions: 'CreateInfiniteQueryOptions',
          UseInfiniteQueryResult: 'CreateInfiniteQueryResult',
          useInfiniteQuery: 'createInfiniteQuery',
        },
        mutate: {
          useMutation: 'createMutation',
          UseMutationOptions: 'CreateMutationOptions',
        },
      }
    }

    if (framework === 'vue') {
      return {
        getName: (operation) => resolveName({ name: `use ${operation.getOperationId()}` }),
        query: {
          useQuery: 'useQuery',
          QueryKey: 'QueryKey',
          UseQueryResult: 'UseQueryReturnType',
          UseQueryOptions: 'UseQueryOptions',
          QueryOptions: 'QueryOptions',
          UseInfiniteQueryOptions: 'UseInfiniteQueryOptions',
          UseInfiniteQueryResult: 'UseInfiniteQueryReturnType',
          useInfiniteQuery: 'useInfiniteQuery',
        },
        mutate: {
          useMutation: 'useMutation',
          UseMutationOptions: 'VueMutationObserverOptions',
        },
      }
    }

    return {
      getName: (operation) => resolveName({ name: `use ${operation.getOperationId()}` }),
      query: {
        useQuery: 'useQuery',
        QueryKey: 'QueryKey',
        UseQueryResult: 'UseQueryResult',
        UseQueryOptions: 'UseQueryOptions',
        QueryOptions: 'QueryOptions',
        UseInfiniteQueryOptions: 'UseInfiniteQueryOptions',
        UseInfiniteQueryResult: 'UseInfiniteQueryResult',
        useInfiniteQuery: 'useInfiniteQuery',
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

  getQueryKey(operation: Operation, schemas: OperationSchemas): { source: string; name: string } {
    const name = camelCase(`${operation.getOperationId()}QueryKey`)

    const pathParamsTyped = getParams(schemas.pathParams, { typed: true })

    const options = [
      pathParamsTyped,
      schemas.queryParams?.name ? `params${!schemas.queryParams.schema.required ? '?' : ''}: ${schemas.queryParams.name}` : undefined,
    ].filter(Boolean)
    const result = [new URLPath(operation.path).template, schemas.queryParams?.name ? `...(params ? [params] : [])` : undefined].filter(Boolean)

    const source = `export const ${name} = (${options.join(', ')}) => [${result.join(',')}] as const;`

    return { source, name }
  }

  getQueryOptions(operation: Operation, schemas: OperationSchemas): { source: string; name: string } {
    const { framework } = this.options
    const imports = this.getFrameworkSpecificImports(framework)
    const name = camelCase(`${operation.getOperationId()}QueryOptions`)

    const queryKeyName = this.getQueryKey(operation, schemas).name

    const pathParams = getParams(schemas.pathParams)
    const pathParamsTyped = getParams(schemas.pathParams, { typed: true })
    let errors: Resolver[] = []

    if (schemas.errors) {
      errors = this.resolveErrors(schemas.errors?.map((item) => item.statusCode && { operation, statusCode: item.statusCode }).filter(Boolean))
    }

    const generics = [`TData = ${schemas.response.name}`, `TError = ${errors.map((error) => error.name).join(' | ') || 'unknown'}`]
    const clientGenerics = ['TData', 'TError']
    const options = [
      pathParamsTyped,
      schemas.queryParams?.name ? `params${!schemas.queryParams.schema.required ? '?' : ''}: ${schemas.queryParams.name}` : undefined,
    ].filter(Boolean)
    let queryKey = `${queryKeyName}(${schemas.pathParams?.name ? `${pathParams}, ` : ''}${schemas.queryParams?.name ? 'params' : ''})`

    if (framework === 'solid') {
      queryKey = `() => ${queryKey}`
    }

    const source = `
    export function ${name} <${generics.join(', ')}>(${options.join(', ')}): ${imports.query.UseQueryOptions}<${clientGenerics.join(', ')}> {
      const queryKey = ${queryKey};

      return {
        queryKey,
        queryFn: () => {
          return client<${clientGenerics.join(', ')}>({
            method: "get",
            url: ${new URLPath(operation.path).template},
            ${schemas.queryParams?.name ? 'params' : ''}
          });
        },
      };
    };
  `

    return { source, name }
  }

  getQueryOptionsInfinite(operation: Operation, schemas: OperationSchemas): { source: string; name: string } {
    const { framework, queryParam = 'id' } = this.options
    const imports = this.getFrameworkSpecificImports(framework)
    const name = camelCase(`${operation.getOperationId()}QueryOptionsInfinite`)

    const queryKeyName = this.getQueryKey(operation, schemas).name

    const pathParams = getParams(schemas.pathParams)
    const pathParamsTyped = getParams(schemas.pathParams, { typed: true })
    let errors: Resolver[] = []

    if (schemas.errors) {
      errors = this.resolveErrors(schemas.errors?.map((item) => item.statusCode && { operation, statusCode: item.statusCode }).filter(Boolean))
    }

    const generics = [`TData = ${schemas.response.name}`, `TError = ${errors.map((error) => error.name).join(' | ') || 'unknown'}`]
    const clientGenerics = ['TData', 'TError']
    const options = [
      pathParamsTyped,
      schemas.queryParams?.name ? `params${!schemas.queryParams.schema.required ? '?' : ''}: ${schemas.queryParams.name}` : undefined,
    ].filter(Boolean)
    let queryKey = `${queryKeyName}(${schemas.pathParams?.name ? `${pathParams}, ` : ''}${schemas.queryParams?.name ? 'params' : ''})`

    if (framework === 'solid') {
      queryKey = `() => ${queryKey}`
    }

    const source = `
    export function ${name} <${generics.join(', ')}>(${options.join(', ')}): ${imports.query.UseInfiniteQueryOptions}<${clientGenerics.join(', ')}> {
      const queryKey = ${queryKey};

      return {
        queryKey,
        queryFn: ({ pageParam }) => {
          return client<${clientGenerics.join(', ')}>({
            method: "get",
            url: ${new URLPath(operation.path).template},
            ${
              schemas.queryParams?.name
                ? `params: {
              ...params,
              ['${queryParam}']: pageParam,
            }`
                : ''
            }
          });
        },
      };
    };
  `

    return { source, name }
  }

  getQuery(operation: Operation, schemas: OperationSchemas): { source: string; name: string } {
    const { framework } = this.options
    const imports = this.getFrameworkSpecificImports(framework)

    const queryKeyName = this.getQueryKey(operation, schemas).name
    const queryOptionsName = this.getQueryOptions(operation, schemas).name
    const name = this.resolve(operation)?.name
    const pathParams = getParams(schemas.pathParams)
    const pathParamsTyped = getParams(schemas.pathParams, { typed: true })
    const comments = getComments(operation)
    let errors: Resolver[] = []

    if (schemas.errors) {
      errors = this.resolveErrors(schemas.errors?.map((item) => item.statusCode && { operation, statusCode: item.statusCode }).filter(Boolean))
    }

    const generics = [`TData = ${schemas.response.name}`, `TError = ${errors.map((error) => error.name).join(' | ') || 'unknown'}`]
    const clientGenerics = ['TData', 'TError']
    const options = [
      pathParamsTyped,
      schemas.queryParams?.name ? `params${!schemas.queryParams.schema.required ? '?' : ''}: ${schemas.queryParams.name}` : '',
      `options?: { query?: ${imports.query.UseQueryOptions}<${clientGenerics.join(', ')}> }`,
    ].filter(Boolean)
    const queryKey = `${queryKeyName}(${schemas.pathParams?.name ? `${pathParams}, ` : ''}${schemas.queryParams?.name ? 'params' : ''})`
    const queryOptions = `${queryOptionsName}<${clientGenerics.join(', ')}>(${schemas.pathParams?.name ? `${pathParams}, ` : ''}${
      schemas.queryParams?.name ? 'params' : ''
    })`

    const source = `
    ${createJSDocBlockText({ comments })}
    export function ${name} <${generics.join(',')}>(${options.join(', ')}): ${imports.query.UseQueryResult}<${clientGenerics.join(
      ', '
    )}> & { queryKey: QueryKey } {
      const { query: queryOptions } = options ?? {};
      const queryKey = queryOptions?.queryKey${framework === 'solid' ? `?.()` : ''} ?? ${queryKey};
      
      const query = ${imports.query.useQuery}<${clientGenerics.join(', ')}>({
        ...${queryOptions},
        ...queryOptions
      }) as ${imports.query.UseQueryResult}<${clientGenerics.join(', ')}> & { queryKey: QueryKey };

      query.queryKey = queryKey as QueryKey;

      return query;
    };
  `

    return { source, name }
  }

  getQueryInfinite(operation: Operation, schemas: OperationSchemas): { source: string; name: string } {
    const { framework } = this.options
    const imports = this.getFrameworkSpecificImports(framework)

    const queryKeyName = this.getQueryKey(operation, schemas).name
    const queryOptionsName = this.getQueryOptionsInfinite(operation, schemas).name // changed
    const name = `${this.resolve(operation)?.name}Infinite`
    const pathParams = getParams(schemas.pathParams)
    const pathParamsTyped = getParams(schemas.pathParams, { typed: true })
    const comments = getComments(operation)
    let errors: Resolver[] = []

    if (schemas.errors) {
      errors = this.resolveErrors(schemas.errors?.map((item) => item.statusCode && { operation, statusCode: item.statusCode }).filter(Boolean))
    }

    const generics = [`TData = ${schemas.response.name}`, `TError = ${errors.map((error) => error.name).join(' | ') || 'unknown'}`]
    const clientGenerics = ['TData', 'TError']
    const options = [
      pathParamsTyped,
      schemas.queryParams?.name ? `params${!schemas.queryParams.schema.required ? '?' : ''}: ${schemas.queryParams.name}` : '',
      `options?: { query?: ${imports.query.UseInfiniteQueryOptions}<${clientGenerics.join(', ')}> }`,
    ].filter(Boolean)
    const queryKey = `${queryKeyName}(${schemas.pathParams?.name ? `${pathParams}, ` : ''}${schemas.queryParams?.name ? 'params' : ''})`
    const queryOptions = `${queryOptionsName}<${clientGenerics.join(', ')}>(${schemas.pathParams?.name ? `${pathParams}, ` : ''}${
      schemas.queryParams?.name ? 'params' : ''
    })`

    const source = `
    ${createJSDocBlockText({ comments })}
    export function ${name} <${generics.join(',')}>(${options.join(', ')}): ${imports.query.UseInfiniteQueryResult}<${clientGenerics.join(
      ', '
    )}> & { queryKey: QueryKey } {
      const { query: queryOptions } = options ?? {};
      const queryKey = queryOptions?.queryKey${framework === 'solid' ? `?.()` : ''} ?? ${queryKey};
      
      const query = ${imports.query.useInfiniteQuery}<${clientGenerics.join(', ')}>({
        ...${queryOptions},
        ...queryOptions
      }) as ${imports.query.UseInfiniteQueryResult}<${clientGenerics.join(', ')}> & { queryKey: QueryKey };

      query.queryKey = queryKey as QueryKey;

      return query;
    };
  `

    return { source, name }
  }

  async get(operation: Operation, schemas: OperationSchemas): Promise<File | null> {
    const { clientPath } = this.options

    const hook = this.resolve(operation)
    const type = this.resolveType(operation)

    const sources: string[] = []
    let errors: Resolver[] = []

    if (schemas.errors) {
      errors = this.resolveErrors(schemas.errors?.map((item) => item.statusCode && { operation, statusCode: item.statusCode }).filter(Boolean))
    }

    const { source: queryKey } = this.getQueryKey(operation, schemas)
    const { source: queryOptions } = this.getQueryOptions(operation, schemas)
    const { source: query } = this.getQuery(operation, schemas)

    const { source: queryOptionsInfinite } = this.getQueryOptionsInfinite(operation, schemas)
    const { source: queryInfinite } = this.getQueryInfinite(operation, schemas)

    sources.push(queryKey, queryOptions, query)
    sources.push(queryOptionsInfinite, queryInfinite)

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
          name: [schemas.response.name, schemas.pathParams?.name, schemas.queryParams?.name, ...errors.map((error) => error.name)].filter(Boolean),
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
      errors = this.resolveErrors(schemas.errors?.map((item) => item.statusCode && { operation, statusCode: item.statusCode }).filter(Boolean))
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
                url: ${new URLPath(operation.path).template},
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
          ].filter(Boolean),
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
      errors = this.resolveErrors(schemas.errors?.map((item) => item.statusCode && { operation, statusCode: item.statusCode }).filter(Boolean))
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
                url: ${new URLPath(operation.path).template},
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
          ].filter(Boolean),
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
      errors = this.resolveErrors(schemas.errors?.map((item) => item.statusCode && { operation, statusCode: item.statusCode }).filter(Boolean))
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
                url: ${new URLPath(operation.path).template},
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
          ].filter(Boolean),
          path: getRelativePath(hook.filePath, type.filePath),
          isTypeOnly: true,
        },
      ],
    }
  }
}
