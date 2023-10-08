import { getRelativePath } from '@kubb/core'
import { OperationGenerator as Generator } from '@kubb/swagger'
import { pluginName as swaggerTypescriptPluginName } from '@kubb/swagger-ts'

import type { File, OptionalPath, PluginContext } from '@kubb/core'
import type { ContentType, Oas, Operation, OperationSchemas, Resolver, SkipBy } from '@kubb/swagger'
import type { ResolvePathOptions, Framework, FrameworkImports } from '../types.ts'
import { QueryBuilder } from '../builders/QueryBuilder.ts'
import type { FileMeta } from '../types.ts'
import { pluginName } from '../plugin.ts'
import type { Options as PluginOptions } from '../types'

type Options = {
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
    const { oas, clientPath, framework, infinite, dataReturnType } = this.options

    const hook = this.resolve(operation)
    const type = this.resolveType(operation)

    let errors: Resolver[] = []
    const frameworkImports = this.getFrameworkSpecificImports(framework)

    if (schemas.errors) {
      errors = this.resolveErrors(schemas.errors?.map((item) => item.statusCode && { operation, statusCode: item.statusCode }).filter(Boolean))
    }

    const source = new QueryBuilder(oas).configure({ errors, framework, frameworkImports, operation, schemas, infinite, dataReturnType }).print('query')

    return {
      path: hook.filePath,
      fileName: hook.fileName,
      source,
      imports: [
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
    const { oas, clientPath, framework, dataReturnType } = this.options

    const hook = this.resolve(operation)
    const type = this.resolveType(operation)

    let errors: Resolver[] = []
    const frameworkImports = this.getFrameworkSpecificImports(framework)

    if (schemas.errors) {
      errors = this.resolveErrors(schemas.errors?.map((item) => item.statusCode && { operation, statusCode: item.statusCode }).filter(Boolean))
    }

    const source = new QueryBuilder(oas).configure({ errors, framework, frameworkImports, operation, schemas, dataReturnType }).print('mutation')

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
