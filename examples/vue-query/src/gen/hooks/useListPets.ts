import type { QueryKey, UseQueryReturnType, UseQueryOptions, UseInfiniteQueryOptions, UseInfiniteQueryReturnType } from '@tanstack/vue-query'
import { useQuery, useInfiniteQuery } from '@tanstack/vue-query'
import client from '@kubb/swagger-client/client'
import type { ListPetsQueryResponse, ListPetsQueryParams } from '../models/ListPets'

export const listPetsQueryKey = (params?: ListPetsQueryParams) => [`/pets`, ...(params ? [params] : [])] as const

export function listPetsQueryOptions<TData = ListPetsQueryResponse, TError = unknown>(
  params?: ListPetsQueryParams,
  options: Partial<Parameters<typeof client>[0]> = {},
): UseQueryOptions<TData, TError> {
  const queryKey = listPetsQueryKey(params)

  return {
    queryKey,
    queryFn: () => {
      return client<TData, TError>({
        method: 'get',
        url: `/pets`,
        params,
        ...options,
      })
    },
  }
}

/**
 * @summary List all pets
 * @link /pets
 */
export function useListPets<TData = ListPetsQueryResponse, TError = unknown>(
  params?: ListPetsQueryParams,
  options?: { query?: UseQueryOptions<TData, TError> },
): UseQueryReturnType<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? listPetsQueryKey(params)

  const query = useQuery<TData, TError>({
    ...listPetsQueryOptions<TData, TError>(params),
    ...queryOptions,
  }) as UseQueryReturnType<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey as QueryKey

  return query
}

export function listPetsQueryOptionsInfinite<TData = ListPetsQueryResponse, TError = unknown>(
  params?: ListPetsQueryParams,
  options: Partial<Parameters<typeof client>[0]> = {},
): UseInfiniteQueryOptions<TData, TError> {
  const queryKey = listPetsQueryKey(params)

  return {
    queryKey,
    queryFn: ({ pageParam }) => {
      return client<TData, TError>({
        method: 'get',
        url: `/pets`,
        ...options,
        params: {
          ...params,
          ['id']: pageParam,
          ...(options.params || {}),
        },
      })
    },
  }
}

/**
 * @summary List all pets
 * @link /pets
 */
export function useListPetsInfinite<TData = ListPetsQueryResponse, TError = unknown>(
  params?: ListPetsQueryParams,
  options?: { query?: UseInfiniteQueryOptions<TData, TError> },
): UseInfiniteQueryReturnType<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? listPetsQueryKey(params)

  const query = useInfiniteQuery<TData, TError>({
    ...listPetsQueryOptionsInfinite<TData, TError>(params),
    ...queryOptions,
  }) as UseInfiniteQueryReturnType<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey as QueryKey

  return query
}
