import { PackageManager } from '@kubb/core'
import { getRelativePath } from '@kubb/core/utils'
import { OperationGenerator as Generator, resolve } from '@kubb/swagger'
import { pluginKey as swaggerTypescriptPluginKey, resolve as resolveSwaggerTypescript } from '@kubb/swagger-ts'

import { QueryBuilder } from '../builders/QueryBuilder.tsx'

import type { KubbFile } from '@kubb/core'
import type { Operation, OperationMethodResult, OperationSchema, OperationSchemas, Resolver } from '@kubb/swagger'
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

export class OperationGenerator extends Generator<Options, FileMeta> {
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

    if (framework === 'svelte') {
      const isV5 = new PackageManager().isValidSync('@tanstack/svelte-query', '>=5')

      return {
        isV5,
        getName: (operation) => pluginManager.resolveName({ name: `${operation.getOperationId()} query`, pluginKey: plugin.key }),
        query: {
          useQuery: 'createQuery',
          QueryKey: 'QueryKey',
          UseQueryResult: 'CreateQueryResult',
          UseQueryOptions: 'CreateQueryOptions',
          queryOptions: isV5 ? 'queryOptions' : undefined,
          QueryObserverOptions: isV5 ? 'QueryObserverOptions' : undefined,
          UseInfiniteQueryOptions: 'CreateInfiniteQueryOptions',
          InfiniteQueryObserverOptions: isV5 ? 'InfiniteQueryObserverOptions' : undefined,
          infiniteQueryOptions: isV5 ? 'infiniteQueryOptions' : undefined,
          UseInfiniteQueryResult: 'CreateInfiniteQueryResult',
          useInfiniteQuery: 'createInfiniteQuery',
          InfiniteData: isV5 ? 'InfiniteData' : undefined,
        },
        mutate: {
          useMutation: 'createMutation',
          UseMutationOptions: 'CreateMutationOptions',
          MutationObserverOptions: 'MutationObserverOptions',
          UseMutationResult: 'CreateMutationResult',
        },
      } as unknown as FrameworkImports
    }

    if (framework === 'solid') {
      const isV5 = new PackageManager().isValidSync('@tanstack/solid-query', '>=5')

      return {
        isV5,
        getName: (operation) => pluginManager.resolveName({ name: `${operation.getOperationId()} query`, pluginKey: plugin.key }),
        query: {
          useQuery: 'createQuery',
          QueryKey: 'QueryKey',
          UseQueryResult: 'CreateQueryResult',
          UseQueryOptions: 'CreateQueryOptions',
          queryOptions: isV5 ? 'queryOptions' : undefined,
          QueryObserverOptions: isV5 ? 'QueryObserverOptions' : undefined,
          UseInfiniteQueryOptions: 'CreateInfiniteQueryOptions',
          InfiniteQueryObserverOptions: isV5 ? 'InfiniteQueryObserverOptions' : undefined,
          infiniteQueryOptions: isV5 ? 'infiniteQueryOptions' : undefined,
          UseInfiniteQueryResult: 'CreateInfiniteQueryResult',
          useInfiniteQuery: 'createInfiniteQuery',
          InfiniteData: isV5 ? 'InfiniteData' : undefined,
        },
        queryInfinite: {},
        mutate: {
          useMutation: 'createMutation',
          UseMutationOptions: 'CreateMutationOptions',
          MutationObserverOptions: 'MutationObserverOptions',
          UseMutationResult: 'CreateMutationResult',
        },
      } as unknown as FrameworkImports
    }

    if (framework === 'vue') {
      const isV5 = new PackageManager().isValidSync('@tanstack/vue-query', '>=5')

      return {
        isV5,
        getName: (operation) => pluginManager.resolveName({ name: `use ${operation.getOperationId()}`, pluginKey: plugin.key }),
        query: {
          useQuery: 'useQuery',
          QueryKey: 'QueryKey',
          UseQueryResult: 'UseQueryReturnType',
          UseQueryOptions: 'UseQueryOptions',
          QueryObserverOptions: isV5 ? 'QueryObserverOptions' : undefined,
          UseInfiniteQueryOptions: 'UseInfiniteQueryOptions',
          InfiniteQueryObserverOptions: isV5 ? 'InfiniteQueryObserverOptions' : undefined,
          infiniteQueryOptions: isV5 ? 'infiniteQueryOptions' : undefined,
          UseInfiniteQueryResult: 'UseInfiniteQueryReturnType',
          InfiniteData: isV5 ? 'InfiniteData' : undefined,
        },
        queryInfinite: {},
        mutate: {
          useMutation: 'useMutation',
          UseMutationOptions: isV5 ? 'MutationObserverOptions' : 'VueMutationObserverOptions',
          MutationObserverOptions: 'MutationObserverOptions',
          UseMutationResult: 'UseMutationReturnType',
        },
      } as unknown as FrameworkImports
    }

    const isV5 = new PackageManager().isValidSync('@tanstack/react-query', '>=5')

    return {
      isV5,
      getName: (operation) => pluginManager.resolveName({ name: `use ${operation.getOperationId()}`, pluginKey: plugin.key }),
      query: {
        QueryKey: 'QueryKey',
        // TODO check typings for v5 queryOptions
        // queryOptions: isV5 ? 'queryOptions' : undefined,
        // new types
        hook: 'useQuery',
        Options: isV5 ? 'UseBaseQueryOptions' : 'UseBaseQueryOptions',
        Result: isV5 ? 'UseQueryResult' : 'UseQueryResult',
      },
      queryInfinite: {
        hook: 'useInfiniteQuery',
        Options: isV5 ? 'UseInfiniteQueryOptions' : 'UseInfiniteQueryOptions',
        Result: isV5 ? 'UseInfiniteQueryResult' : 'UseInfiniteQueryResult',
      },
      mutate: {
        hook: 'useMutation',
        // UseInfiniteQueryOptions
        // new types
        Options: isV5 ? 'UseMutationOptions' : 'UseMutationOptions',
        Result: isV5 ? 'UseMutationResult' : 'UseMutationResult',
      },
    }
  }

  getQueryImports(type: 'query' | 'queryInfinite' | 'mutate'): Array<KubbFile.Import> {
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
      const isV5 = this.getFrameworkSpecificImports('vue').isV5

      const values = Object.values(this.getFrameworkSpecificImports('vue')[type])
        .filter(Boolean)
        .filter((item) => item !== 'VueMutationObserverOptions')

      return [
        isV5 ? undefined : {
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
      ].filter(Boolean)
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

  async get(operation: Operation, schemas: OperationSchemas, options: Options): OperationMethodResult<FileMeta> {
    const { clientPath, framework, infinite, dataReturnType } = options
    const { pluginManager, oas, plugin } = this.context

    const hook = this.resolve(operation)
    const type = this.resolveType(operation)
    const frameworkImports = this.getFrameworkSpecificImports(framework)
    const name = frameworkImports.getName(operation)

    let errors: Resolver[] = []

    if (schemas.errors) {
      errors = this.resolveErrors(operation, schemas.errors)
    }

    const queryBuilder = new QueryBuilder({ errors, framework, frameworkImports, infinite, dataReturnType }, { oas, plugin, pluginManager, operation, schemas })
    const clientImportPath = this.options.clientImportPath
      ? this.options.clientImportPath
      : clientPath
      ? getRelativePath(hook.path, clientPath)
      : '@kubb/swagger-client/client'

    const root = queryBuilder.render('query', name)
    const { file, getFile } = root

    if (!file) {
      throw new Error('No <File/> being used or File is undefined(see resolvePath/resolveName)')
    }

    // TODO refactor
    const helpersFile = getFile('types')
    const renderedFile = getFile(name)

    return [
      helpersFile
        ? {
          ...helpersFile,
          imports: [...helpersFile.imports || [], {
            name: 'client',
            path: clientImportPath,
          }],
        }
        : undefined,
      renderedFile
        ? {
          path: renderedFile.path,
          baseName: renderedFile.baseName,
          source: renderedFile.source,
          imports: [
            ...(renderedFile.imports || []),
            ...this.getQueryImports('query'),
            ...this.getQueryImports('queryInfinite'),
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
        : undefined,
    ].filter(Boolean)
  }

  async post(operation: Operation, schemas: OperationSchemas, options: Options): OperationMethodResult<FileMeta> {
    const { clientPath, framework, dataReturnType } = options
    const { pluginManager, oas, plugin } = this.context

    const hook = this.resolve(operation)
    const type = this.resolveType(operation)
    const frameworkImports = this.getFrameworkSpecificImports(framework)
    const name = frameworkImports.getName(operation)

    let errors: Resolver[] = []

    if (schemas.errors) {
      errors = this.resolveErrors(operation, schemas.errors)
    }

    const queryBuilder = new QueryBuilder({ errors, framework, frameworkImports, dataReturnType }, { oas, plugin, pluginManager, operation, schemas })
    const clientImportPath = this.options.clientImportPath
      ? this.options.clientImportPath
      : clientPath
      ? getRelativePath(hook.path, clientPath)
      : '@kubb/swagger-client/client'

    const root = queryBuilder.render('mutation', name)
    const { file, getFile } = root

    if (!file) {
      throw new Error('No <File/> being used or File is undefined(see resolvePath/resolveName)')
    }

    // TODO refactor
    const helpersFile = getFile('types')
    const renderedFile = getFile(name)

    return [
      helpersFile
        ? {
          ...helpersFile,
          imports: [...helpersFile.imports || [], {
            name: 'client',
            path: clientImportPath,
          }],
        }
        : undefined,
      renderedFile
        ? {
          path: renderedFile.path,
          baseName: renderedFile.baseName,
          source: renderedFile.source,
          imports: [
            ...(renderedFile.imports || []),
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
        : undefined,
    ].filter(Boolean)
  }

  async put(operation: Operation, schemas: OperationSchemas, options: Options): OperationMethodResult<FileMeta> {
    return this.post(operation, schemas, options)
  }
  async patch(operation: Operation, schemas: OperationSchemas, options: Options): OperationMethodResult<FileMeta> {
    return this.post(operation, schemas, options)
  }
  async delete(operation: Operation, schemas: OperationSchemas, options: Options): OperationMethodResult<FileMeta> {
    return this.post(operation, schemas, options)
  }
}
