import { PackageManager } from '@kubb/core'

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function getImportNames() {
  const isV5 = new PackageManager().isValidSync(/@tanstack/, '>=5')

  return {
    mutation: {
      'react': {
        path: '@tanstack/react-query',
        hookName: 'useMutation',
        optionsType: 'UseMutationOptions',
        resultType: 'UseMutationResult',
      },
      'solid': {
        path: '@tanstack/solid-query',
        hookName: 'createMutation',
        optionsType: 'CreateMutationOptions',
        resultType: 'CreateMutationResult',
      },
      'svelte': {
        path: '@tanstack/svelte-query',
        hookName: 'createMutation',
        optionsType: 'CreateMutationOptions',
        resultType: 'CreateMutationResult',
      },
      'vue': {
        path: '@tanstack/vue-query',
        hookName: 'useMutation',
        optionsType: isV5 ? 'UseMutationOptions' : 'VueMutationObserverOptions',
        resultType: 'UseMutationReturnType',
      },
    },
    query: {
      'react': {
        path: '@tanstack/react-query',
        hookName: 'useQuery',
        optionsType: isV5 ? 'QueryObserverOptions' : 'UseBaseQueryOptions',
        resultType: 'UseQueryResult',
      },
      'solid': {
        path: '@tanstack/solid-query',
        hookName: 'createQuery',
        optionsType: 'CreateBaseQueryOptions',
        resultType: 'CreateQueryResult',
      },
      'svelte': {
        path: '@tanstack/svelte-query',
        hookName: 'createQuery',
        optionsType: 'CreateBaseQueryOptions',
        resultType: 'CreateQueryResult',
      },
      'vue': {
        path: '@tanstack/vue-query',
        hookName: 'useQuery',
        optionsType: isV5 ? 'QueryObserverOptions' : 'VueQueryObserverOptions',
        resultType: isV5 ? 'UseQueryReturnType' : 'UseQueryReturnType',
      },
    },
    queryInfinite: {
      'react': {
        path: '@tanstack/react-query',
        hookName: 'useInfiniteQuery',
        optionsType: isV5 ? 'InfiniteQueryObserverOptions' : 'UseInfiniteQueryOptions',
        resultType: 'UseInfiniteQueryResult',
      },
      'solid': {
        path: '@tanstack/solid-query',
        hookName: 'createInfiniteQuery',
        optionsType: 'CreateInfiniteQueryOptions',
        resultType: 'CreateInfiniteQueryResult',
      },
      'svelte': {
        path: '@tanstack/svelte-query',
        hookName: 'createInfiniteQuery',
        optionsType: 'CreateInfiniteQueryOptions',
        resultType: 'CreateInfiniteQueryResult',
      },
      'vue': {
        path: '@tanstack/vue-query',
        hookName: 'useInfiniteQuery',
        optionsType: isV5 ? 'UseInfiniteQueryOptions' : 'VueInfiniteQueryObserverOptions',
        resultType: isV5 ? 'UseInfiniteQueryReturnType' : 'VueInfiniteQueryObserverOptions',
      },
    },
    querySuspense: {
      'react': {
        path: '@tanstack/react-query',
        hookName: 'useSuspenseQuery',
        optionsType: 'UseSuspenseQueryOptions',
        resultType: 'UseSuspenseQueryResult',
      },
    },
  } as const
}
