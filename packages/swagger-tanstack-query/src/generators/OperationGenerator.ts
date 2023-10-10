import { getRelativePath } from '@kubb/core'
import { OperationGenerator as Generator, resolve } from '@kubb/swagger'
import { resolve as resolveSwaggerTypescript, pluginName as swaggerTypescriptPluginName } from '@kubb/swagger-ts'

import { QueryBuilder } from '../builders/QueryBuilder.tsx'
import { pluginName } from '../plugin.ts'

import type { File, OptionalPath, PluginContext, PluginManager } from '@kubb/core'
import type { ContentType, Oas, Operation, OperationSchema, OperationSchemas, ResolvePathOptions, Resolver, SkipBy } from '@kubb/swagger'
import type { Options as PluginOptions } from '../types'
import type { FileMeta, Framework, FrameworkImports } from '../types.ts'

type Options = {
  pluginManager: PluginManager
  framework: Framework
  clientPath?: OptionalPath
  dataReturnType: PluginOptions['dataReturnType']
  oas: Oas
  contentType?: ContentType
  skipBy: SkipBy[]
  resolvePath: PluginContext<ResolvePathOptions>['resolvePath']
  resolveName: PluginContext['resolveName']
  /**
   * Only used of infinite
   */
  infinite?: {
    queryParam?: string
  }
}

export class OperationGenerator extends Generator<Options> {
  resolve(operation: Operation): Resolver {
    const { resolvePath, resolveName, framework } = this.options

    const imports = this.getFrameworkSpecificImports(framework)
    const name = imports.getName(operation)

    return resolve({
      name,
      operation,
      resolveName,
      resolvePath,
      pluginName,
    })
  }

  resolveType(operation: Operation): Resolver {
    const { resolvePath, resolveName } = this.options

    return resolveSwaggerTypescript({
      operation,
      resolveName,
      resolvePath,
    })
  }

  resolveError(operation: Operation, statusCode: number): Resolver {
    const { resolvePath, resolveName } = this.options

    const name = resolveName({ name: `${operation.getOperationId()} ${statusCode}`, pluginName: swaggerTypescriptPluginName })

    return resolveSwaggerTypescript({
      name,
      operation,
      resolveName,
      resolvePath,
    })
  }

  resolveErrors(operation: Operation, errors: OperationSchema[]): Resolver[] {
    return errors
      .map((item) => {
        if (item.statusCode) {
          return this.resolveError(operation, item.statusCode)
        }
        return undefined
      })
      .filter(Boolean)
  }

  getFrameworkSpecificImports(framework: Options['framework']): FrameworkImports {
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
          UseMutationResult: 'CreateMutationResult',
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
          UseMutationResult: 'CreateMutationResult',
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
          UseMutationResult: 'UseMutationReturnType',
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
        UseMutationResult: 'UseMutationResult',
      },
    }
  }

  getQueryImports(type: 'query' | 'mutate'): Required<File>['imports'] {
    const { framework } = this.options

    if (framework === 'svelte') {
      const values = Object.values(this.getFrameworkSpecificImports('svelte')[type])

      return [
        {
          name: values.filter((item) => /[A-Z]/.test(item.charAt(0))),
          path: '@tanstack/svelte-query',
          isTypeOnly: true,
        },
        {
          name: values.filter((item) => !/[A-Z]/.test(item.charAt(0))),
          path: '@tanstack/svelte-query',
        },
      ]
    }

    if (framework === 'solid') {
      const values = Object.values(this.getFrameworkSpecificImports('solid')[type])

      return [
        {
          name: values.filter((item) => /[A-Z]/.test(item.charAt(0))),
          path: '@tanstack/solid-query',
          isTypeOnly: true,
        },
        {
          name: values.filter((item) => !/[A-Z]/.test(item.charAt(0))),
          path: '@tanstack/solid-query',
        },
      ]
    }

    if (framework === 'vue') {
      const values = Object.values(this.getFrameworkSpecificImports('vue')[type]).filter((item) => item !== 'VueMutationObserverOptions')

      return [
        {
          name: ['VueMutationObserverOptions'],
          path: '@tanstack/vue-query/build/lib/useMutation',
          isTypeOnly: true,
        },
        {
          name: ['unref'],
          path: 'vue',
        },
        {
          name: ['MaybeRef'],
          path: 'vue',
          isTypeOnly: true,
        },
        {
          name: values.filter((item) => /[A-Z]/.test(item.charAt(0))),
          path: '@tanstack/vue-query',
          isTypeOnly: true,
        },
        {
          name: values.filter((item) => !/[A-Z]/.test(item.charAt(0))),
          path: '@tanstack/vue-query',
        },
      ]
    }

    const values = Object.values(this.getFrameworkSpecificImports('react')[type])

    return [
      {
        name: values.filter((item) => /[A-Z]/.test(item.charAt(0))),
        path: '@tanstack/react-query',
        isTypeOnly: true,
      },
      {
        name: values.filter((item) => !/[A-Z]/.test(item.charAt(0))),
        path: '@tanstack/react-query',
      },
    ]
  }

  async all(): Promise<File | null> {
    return null
  }

  async get(operation: Operation, schemas: OperationSchemas): Promise<File<FileMeta> | null> {
    const { pluginManager, oas, clientPath, framework, infinite, dataReturnType } = this.options

    const hook = this.resolve(operation)
    const type = this.resolveType(operation)

    let errors: Resolver[] = []
    const frameworkImports = this.getFrameworkSpecificImports(framework)

    if (schemas.errors) {
      errors = this.resolveErrors(operation, schemas.errors)
    }

    const queryBuilder = new QueryBuilder(oas).configure({ pluginManager, errors, framework, frameworkImports, operation, schemas, infinite, dataReturnType })

    return {
      path: hook.filePath,
      fileName: hook.fileName,
      source: queryBuilder.print('query'),
      imports: [
        ...queryBuilder.imports(),
        ...this.getQueryImports('query'),
        {
          name: 'client',
          path: clientPath ? getRelativePath(hook.filePath, clientPath) : '@kubb/swagger-client/client',
        },
        {
          name: ['ResponseConfig'],
          path: clientPath ? getRelativePath(hook.filePath, clientPath) : '@kubb/swagger-client/client',
          isTypeOnly: true,
        },
        {
          name: [
            schemas.response.name,
            schemas.pathParams?.name,
            schemas.queryParams?.name,
            schemas.headerParams?.name,
            ...errors.map((error) => error.name),
          ].filter(Boolean),
          path: getRelativePath(hook.filePath, type.filePath),
          isTypeOnly: true,
        },
      ],
      meta: {
        pluginName,
        tag: operation.getTags()[0]?.name,
      },
    }
  }

  async post(operation: Operation, schemas: OperationSchemas): Promise<File<FileMeta> | null> {
    const { pluginManager, oas, clientPath, framework, dataReturnType } = this.options

    const hook = this.resolve(operation)
    const type = this.resolveType(operation)

    let errors: Resolver[] = []
    const frameworkImports = this.getFrameworkSpecificImports(framework)

    if (schemas.errors) {
      errors = this.resolveErrors(operation, schemas.errors)
    }

    const queryBuilder = new QueryBuilder(oas).configure({ pluginManager, errors, framework, frameworkImports, operation, schemas, dataReturnType })

    return {
      path: hook.filePath,
      fileName: hook.fileName,
      source: queryBuilder.print('mutation'),
      imports: [
        ...queryBuilder.imports(),
        ...this.getQueryImports('mutate'),
        {
          name: 'client',
          path: clientPath ? getRelativePath(hook.filePath, clientPath) : '@kubb/swagger-client/client',
        },
        {
          name: ['ResponseConfig'],
          path: clientPath ? getRelativePath(hook.filePath, clientPath) : '@kubb/swagger-client/client',
          isTypeOnly: true,
        },
        {
          name: [
            schemas.request?.name,
            schemas.response.name,
            schemas.pathParams?.name,
            schemas.queryParams?.name,
            schemas.headerParams?.name,
            ...errors.map((error) => error.name),
          ].filter(Boolean),
          path: getRelativePath(hook.filePath, type.filePath),
          isTypeOnly: true,
        },
      ],
      meta: {
        pluginName,
        tag: operation.getTags()[0]?.name,
      },
    }
  }

  async put(operation: Operation, schemas: OperationSchemas): Promise<File<FileMeta> | null> {
    return this.post(operation, schemas)
  }
  async patch(operation: Operation, schemas: OperationSchemas): Promise<File<FileMeta> | null> {
    return this.post(operation, schemas)
  }
  async delete(operation: Operation, schemas: OperationSchemas): Promise<File<FileMeta> | null> {
    return this.post(operation, schemas)
  }
}
