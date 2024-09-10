const reactQueryDepRegex = /@tanstack\/(react|solid|vue|svelte)-query/

export function getImportNames() {
  return {
    mutation: {
      react: {
        path: '@tanstack/react-query',
        hookName: 'useMutation',
        optionsType: 'UseMutationOptions',
        resultType: 'UseMutationResult',
      },
      solid: {
        path: '@tanstack/solid-query',
        hookName: 'createMutation',
        optionsType: 'CreateMutationOptions',
        resultType: 'CreateMutationResult',
      },
      svelte: {
        path: '@tanstack/svelte-query',
        hookName: 'createMutation',
        optionsType: 'CreateMutationOptions',
        resultType: 'CreateMutationResult',
      },
      vue: {
        path: '@tanstack/vue-query',
        hookName: 'useMutation',
        optionsType: 'UseMutationOptions',
        resultType: 'UseMutationReturnType',
      },
    },
    query: {
      react: {
        path: '@tanstack/react-query',
        hookName: 'useQuery',
        optionsType: 'QueryObserverOptions',
        resultType: 'UseQueryResult',
      },
      solid: {
        path: '@tanstack/solid-query',
        hookName: 'createQuery',
        optionsType: 'CreateBaseQueryOptions',
        resultType: 'CreateQueryResult',
      },
      svelte: {
        path: '@tanstack/svelte-query',
        hookName: 'createQuery',
        optionsType: 'CreateBaseQueryOptions',
        resultType: 'CreateQueryResult',
      },
      vue: {
        path: '@tanstack/vue-query',
        hookName: 'useQuery',
        optionsType: 'QueryObserverOptions',
        resultType: 'UseQueryReturnType',
      },
    },
    queryInfinite: {
      react: {
        path: '@tanstack/react-query',
        hookName: 'useInfiniteQuery',
        optionsType: 'InfiniteQueryObserverOptions',
        resultType: 'UseInfiniteQueryResult',
      },
      solid: {
        path: '@tanstack/solid-query',
        hookName: 'createInfiniteQuery',
        optionsType: 'CreateInfiniteQueryOptions',
        resultType: 'CreateInfiniteQueryResult',
      },
      svelte: {
        path: '@tanstack/svelte-query',
        hookName: 'createInfiniteQuery',
        optionsType: 'CreateInfiniteQueryOptions',
        resultType: 'CreateInfiniteQueryResult',
      },
      vue: {
        path: '@tanstack/vue-query',
        hookName: 'useInfiniteQuery',
        optionsType: 'UseInfiniteQueryOptions',
        resultType: 'UseInfiniteQueryReturnType',
      },
    },
    querySuspense: {
      react: {
        path: '@tanstack/react-query',
        hookName: 'useSuspenseQuery',
        optionsType: 'UseSuspenseQueryOptions',
        resultType: 'UseSuspenseQueryResult',
      },
    },
  } as const
}
