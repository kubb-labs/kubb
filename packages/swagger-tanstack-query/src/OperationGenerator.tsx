import { PackageManager } from '@kubb/core'
import { createRoot } from '@kubb/react'
import { OperationGenerator as Generator } from '@kubb/swagger'

import { Mutation } from './components/Mutation.tsx'
import { Query } from './components/Query.tsx'

import type { KubbFile } from '@kubb/core'
import type { AppContextProps } from '@kubb/react'
import type { Operation, OperationMethodResult, OperationSchemas } from '@kubb/swagger'
import type { FileMeta, FrameworkImports, PluginOptions } from './types.ts'

export class OperationGenerator extends Generator<PluginOptions['resolvedOptions'], PluginOptions, FileMeta> {
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
    const { pluginManager, plugin } = this.context

    const root = createRoot<AppContextProps<PluginOptions['appMeta']>>({ logger: pluginManager.logger })
    root.render(
      <>
        <Query.File framework={options.framework} />
        {/** {inifinte && <QueryInfinite.File framework={options.framework} />} */}
      </>,
      { meta: { pluginManager, plugin: { ...plugin, options }, schemas, operation } },
    )

    return root.files
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
