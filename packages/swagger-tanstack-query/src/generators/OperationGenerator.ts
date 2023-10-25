import { PackageManager } from '@kubb/core'
import { getRelativePath } from '@kubb/core/utils'
import { OperationGenerator as Generator, resolve } from '@kubb/swagger'
import { pluginKey as swaggerTypescriptPluginKey, resolve as resolveSwaggerTypescript } from '@kubb/swagger-ts'

import { QueryBuilder } from '../builders/QueryBuilder.tsx'

import type { KubbFile } from '@kubb/core'
import type { Operation, OperationSchema, OperationSchemas, Resolver } from '@kubb/swagger'
import type { FileMeta, FrameworkImports, Options as PluginOptions } from '../types.ts'

type Options = {
  framework: NonNullable<PluginOptions['framework']>
  clientPath?: PluginOptions['client']
  clientImportPath?: PluginOptions['clientImportPath']
  dataReturnType: NonNullable<PluginOptions['dataReturnType']>
  /**
   * Only used of infinite
   */
  infinite?: PluginOptions['infinite']
}

export class OperationGenerator extends Generator<Options> {
  resolve(operation: Operation): Resolver {
    const { framework } = this.options
    const { pluginManager, plugin } = this.context

    const imports = this.getFrameworkSpecificImports(framework)
    const name = imports.getName(operation)

    return resolve({
      name,
      operation,
      resolveName: pluginManager.resolveName,
      resolvePath: pluginManager.resolvePath,
      pluginKey: plugin.key,
    })
  }

  resolveType(operation: Operation): Resolver {
    const { pluginManager } = this.context

    return resolveSwaggerTypescript({
      operation,
      resolveName: pluginManager.resolveName,
      resolvePath: pluginManager.resolvePath,
    })
  }

  resolveError(operation: Operation, statusCode: number): Resolver {
    const { pluginManager } = this.context

    const name = pluginManager.resolveName({ name: `${operation.getOperationId()} ${statusCode}`, pluginKey: swaggerTypescriptPluginKey })

    return resolveSwaggerTypescript({
      name,
      operation,
      resolveName: pluginManager.resolveName,
      resolvePath: pluginManager.resolvePath,
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
    const { pluginManager, plugin } = this.context

    const isV5 = new PackageManager().isValidSync('@tanstack/react-query', '>=5')

    if (framework === 'svelte') {
      return {
        getName: (operation) => pluginManager.resolveName({ name: `${operation.getOperationId()} query`, pluginKey: plugin.key }),
        query: {
          useQuery: 'createQuery',
          QueryKey: 'QueryKey',
          UseQueryResult: 'CreateQueryResult',
          UseQueryOptions: 'CreateQueryOptions',
          QueryOptions: 'CreateQueryOptions',
          queryOptions: isV5 ? 'queryOptions' : undefined,
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
        getName: (operation) => pluginManager.resolveName({ name: `${operation.getOperationId()} query`, pluginKey: plugin.key }),
        query: {
          useQuery: 'createQuery',
          QueryKey: 'QueryKey',
          UseQueryResult: 'CreateQueryResult',
          UseQueryOptions: 'CreateQueryOptions',
          QueryOptions: 'CreateQueryOptions',
          queryOptions: isV5 ? 'queryOptions' : undefined,
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
        getName: (operation) => pluginManager.resolveName({ name: `use ${operation.getOperationId()}`, pluginKey: plugin.key }),
        query: {
          useQuery: 'useQuery',
          QueryKey: 'QueryKey',
          UseQueryResult: 'UseQueryReturnType',
          UseQueryOptions: 'UseQueryOptions',
          QueryOptions: 'QueryOptions',
          queryOptions: isV5 ? 'queryOptions' : undefined,
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
      getName: (operation) => pluginManager.resolveName({ name: `use ${operation.getOperationId()}`, pluginKey: plugin.key }),
      query: {
        useQuery: 'useQuery',
        QueryKey: 'QueryKey',
        UseQueryResult: 'UseQueryResult',
        UseQueryOptions: 'UseQueryOptions',
        QueryOptions: 'QueryOptions',
        queryOptions: isV5 ? 'queryOptions' : undefined,
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

  getQueryImports(type: 'query' | 'mutate'): Array<KubbFile.Import> {
    const { framework } = this.options

    if (framework === 'svelte') {
      const values = Object.values(this.getFrameworkSpecificImports('svelte')[type]).filter(Boolean)

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
      const values = Object.values(this.getFrameworkSpecificImports('solid')[type]).filter(Boolean)

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
      const values = Object.values(this.getFrameworkSpecificImports('vue')[type])
        .filter(Boolean)
        .filter((item) => item !== 'VueMutationObserverOptions')

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

    const values = Object.values(this.getFrameworkSpecificImports('react')[type]).filter(Boolean)

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

  async all(): Promise<KubbFile.File | null> {
    return null
  }

  async get(operation: Operation, schemas: OperationSchemas, options: Options): Promise<KubbFile.File<FileMeta> | null> {
    const { clientPath, framework, infinite, dataReturnType } = options
    const { pluginManager, oas, plugin } = this.context

    const hook = this.resolve(operation)
    const type = this.resolveType(operation)
    // TODO remove getName
    const imports = this.getFrameworkSpecificImports(framework)
    const name = imports.getName(operation)

    let errors: Resolver[] = []
    const frameworkImports = this.getFrameworkSpecificImports(framework)

    if (schemas.errors) {
      errors = this.resolveErrors(operation, schemas.errors)
    }

    const queryBuilder = new QueryBuilder({ errors, framework, frameworkImports, infinite, dataReturnType }, { oas, plugin, pluginManager, operation, schemas })
    const clientImportPath = this.options.clientImportPath
      ? this.options.clientImportPath
      : clientPath
      ? getRelativePath(hook.path, clientPath)
      : '@kubb/swagger-client/client'

    const file = queryBuilder.render('query', name).file

    if (!file) {
      throw new Error('No <File/> being used or File is undefined(see resolvePath/resolveName)')
    }

    return {
      path: file.path,
      baseName: file.baseName,
      source: file.source,
      imports: [
        ...(file.imports || []),
        ...this.getQueryImports('query'),
        {
          name: 'client',
          path: clientImportPath,
        },
        {
          name: ['ResponseConfig'],
          path: clientImportPath,
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
          path: getRelativePath(hook.path, type.path),
          isTypeOnly: true,
        },
      ],
      meta: {
        pluginKey: plugin.key,
        tag: operation.getTags()[0]?.name,
      },
    }
  }

  async post(operation: Operation, schemas: OperationSchemas, options: Options): Promise<KubbFile.File<FileMeta> | null> {
    const { clientPath, framework, dataReturnType } = options
    const { pluginManager, oas, plugin } = this.context

    const hook = this.resolve(operation)
    const type = this.resolveType(operation)
    // TODO remove getName
    const imports = this.getFrameworkSpecificImports(framework)
    const name = imports.getName(operation)

    let errors: Resolver[] = []
    const frameworkImports = this.getFrameworkSpecificImports(framework)

    if (schemas.errors) {
      errors = this.resolveErrors(operation, schemas.errors)
    }

    const queryBuilder = new QueryBuilder({ errors, framework, frameworkImports, dataReturnType }, { oas, plugin, pluginManager, operation, schemas })
    const clientImportPath = this.options.clientImportPath
      ? this.options.clientImportPath
      : clientPath
      ? getRelativePath(hook.path, clientPath)
      : '@kubb/swagger-client/client'

    const file = queryBuilder.render('mutation', name).file

    if (!file) {
      throw new Error('No <File/> being used or File is undefined(see resolvePath/resolveName)')
    }

    return {
      path: file.path,
      baseName: file.baseName,
      source: file.source,
      imports: [
        ...(file.imports || []),
        ...this.getQueryImports('mutate'),
        {
          name: 'client',
          path: clientImportPath,
        },
        {
          name: ['ResponseConfig'],
          path: clientImportPath,
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
          path: getRelativePath(hook.path, type.path),
          isTypeOnly: true,
        },
      ],
      meta: {
        pluginKey: plugin.key,
        tag: operation.getTags()[0]?.name,
      },
    }
  }

  async put(operation: Operation, schemas: OperationSchemas, options: Options): Promise<KubbFile.File<FileMeta> | null> {
    return this.post(operation, schemas, options)
  }
  async patch(operation: Operation, schemas: OperationSchemas, options: Options): Promise<KubbFile.File<FileMeta> | null> {
    return this.post(operation, schemas, options)
  }
  async delete(operation: Operation, schemas: OperationSchemas, options: Options): Promise<KubbFile.File<FileMeta> | null> {
    return this.post(operation, schemas, options)
  }
}
