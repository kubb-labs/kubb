import { PackageManager } from '@kubb/core'
import { getRelativePath } from '@kubb/core/utils'
import { createRoot } from '@kubb/react'
import { OperationGenerator as Generator, resolve } from '@kubb/swagger'
import { pluginKey as swaggerTypescriptPluginKey, resolve as resolveSwaggerTypescript } from '@kubb/swagger-ts'

import { QueryBuilder } from './builders/QueryBuilder.tsx'
import { Mutation } from './components/Mutation.tsx'

import type { KubbFile } from '@kubb/core'
import type { AppContextProps } from '@kubb/react'
import type { Operation, OperationMethodResult, OperationSchema, OperationSchemas, Resolver } from '@kubb/swagger'
import type { FileMeta, FrameworkImports, PluginOptions } from './types.ts'

export class OperationGenerator extends Generator<PluginOptions['resolvedOptions'], PluginOptions, FileMeta> {
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

  getFrameworkSpecificImports(framework: PluginOptions['resolvedOptions']['framework']): FrameworkImports {
    const { pluginManager, plugin } = this.context

    if (framework === 'svelte') {
      const isV5 = new PackageManager().isValidSync('@tanstack/svelte-query', '>=5')

      return {
        isV5,
        getName: (operation) => pluginManager.resolveName({ name: `${operation.getOperationId()} query`, pluginKey: plugin.key }),
        query: {
          QueryKey: 'QueryKey',
          // TODO check typings for v5 queryOptions
          // queryOptions: isV5 ? 'queryOptions' : undefined,
          hook: 'createQuery',
          Options: isV5 ? 'CreateBaseQueryOptions' : 'CreateBaseQueryOptions',
          Result: isV5 ? 'CreateQueryResult' : 'CreateQueryResult',
        },
        queryInfinite: {
          hook: 'createInfiniteQuery',
          Options: isV5 ? 'CreateInfiniteQueryOptions' : 'CreateInfiniteQueryOptions',
          Result: isV5 ? 'CreateInfiniteQueryResult' : 'CreateInfiniteQueryResult',
        },
        mutate: {
          hook: 'createMutation',
          Options: isV5 ? 'CreateMutationOptions' : 'CreateMutationOptions',
          Result: isV5 ? 'CreateMutationResult' : 'CreateMutationResult',
        },
      }
    }

    if (framework === 'solid') {
      const isV5 = new PackageManager().isValidSync('@tanstack/solid-query', '>=5')

      return {
        isV5,
        getName: (operation) => pluginManager.resolveName({ name: `${operation.getOperationId()} query`, pluginKey: plugin.key }),
        query: {
          QueryKey: 'QueryKey',
          // TODO check typings for v5 queryOptions
          // queryOptions: isV5 ? 'queryOptions' : undefined,
          hook: 'createQuery',
          Options: isV5 ? 'CreateBaseQueryOptions' : 'CreateBaseQueryOptions',
          Result: isV5 ? 'CreateQueryResult' : 'CreateQueryResult',
        },
        queryInfinite: {
          hook: 'createInfiniteQuery',
          Options: isV5 ? 'CreateInfiniteQueryOptions' : 'CreateInfiniteQueryOptions',
          Result: isV5 ? 'CreateInfiniteQueryResult' : 'CreateInfiniteQueryResult',
        },
        mutate: {
          hook: 'createMutation',
          Options: isV5 ? 'CreateMutationOptions' : 'CreateMutationOptions',
          Result: isV5 ? 'CreateMutationResult' : 'CreateMutationResult',
        },
      }
    }

    if (framework === 'vue') {
      const isV5 = new PackageManager().isValidSync('@tanstack/vue-query', '>=5')

      return {
        isV5,
        getName: (operation) => pluginManager.resolveName({ name: `use ${operation.getOperationId()}`, pluginKey: plugin.key }),
        query: {
          QueryKey: 'QueryKey',
          // TODO check typings for v5 queryOptions
          // queryOptions: isV5 ? 'queryOptions' : undefined,
          hook: 'useQuery',
          Options: isV5 ? 'QueryObserverOptions' : 'VueQueryObserverOptions',
          Result: isV5 ? 'UseQueryReturnType' : 'UseQueryReturnType',
        },
        queryInfinite: {
          hook: 'useInfiniteQuery',
          Options: isV5 ? 'UseInfiniteQueryOptions' : 'VueInfiniteQueryObserverOptions',
          Result: isV5 ? 'UseInfiniteQueryReturnType' : 'UseInfiniteQueryReturnType',
        },
        mutate: {
          hook: 'useMutation',
          Options: isV5 ? 'UseMutationOptions' : 'VueMutationObserverOptions',
          Result: isV5 ? 'UseMutationReturnType' : 'UseMutationReturnType',
        },
      }
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
        // TODO check if we can just use QueryObserverOptions for all v5 frameworks
        Options: isV5 ? 'QueryObserverOptions' : 'UseBaseQueryOptions',
        Result: isV5 ? 'UseQueryResult' : 'UseQueryResult',
      },
      queryInfinite: {
        hook: 'useInfiniteQuery',
        Options: isV5 ? 'UseInfiniteQueryOptions' : 'UseInfiniteQueryOptions',
        Result: isV5 ? 'UseInfiniteQueryResult' : 'UseInfiniteQueryResult',
      },
      mutate: {
        hook: 'useMutation',
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
        .filter((item) => item !== 'VueMutationObserverOptions' && item !== 'VueQueryObserverOptions' && item !== 'VueInfiniteQueryObserverOptions')

      return [
        ...isV5 ? [] : [{
          name: ['VueInfiniteQueryObserverOptions'],
          path: '@tanstack/vue-query/build/lib/types',
          isTypeOnly: true,
        }, {
          name: ['VueMutationObserverOptions'],
          path: '@tanstack/vue-query/build/lib/useMutation',
          isTypeOnly: true,
        }, {
          name: ['VueQueryObserverOptions'],
          path: '@tanstack/vue-query/build/lib/types',
          isTypeOnly: true,
        }],

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

  async get(operation: Operation, schemas: OperationSchemas, options: PluginOptions['resolvedOptions']): OperationMethodResult<FileMeta> {
    const { framework, infinite, dataReturnType } = options
    const { pluginManager, oas, plugin } = this.context

    const clientPath = plugin.options.client

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

  async post(operation: Operation, schemas: OperationSchemas, options: PluginOptions['resolvedOptions']): OperationMethodResult<FileMeta> {
    const { pluginManager, plugin } = this.context

    const root = createRoot<AppContextProps<PluginOptions['appMeta']>>({ logger: pluginManager.logger })
    root.render(<Mutation.File framework={options.framework} />, { meta: { pluginManager, plugin: { ...plugin, options }, schemas, operation } })

    return root.files
  }

  async put(operation: Operation, schemas: OperationSchemas, options: PluginOptions['resolvedOptions']): OperationMethodResult<FileMeta> {
    return this.post(operation, schemas, options)
  }
  async patch(operation: Operation, schemas: OperationSchemas, options: PluginOptions['resolvedOptions']): OperationMethodResult<FileMeta> {
    return this.post(operation, schemas, options)
  }
  async delete(operation: Operation, schemas: OperationSchemas, options: PluginOptions['resolvedOptions']): OperationMethodResult<FileMeta> {
    return this.post(operation, schemas, options)
  }
}
