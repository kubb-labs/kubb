import type { QueryKey, UseQueryReturnType, UseQueryOptions, UseInfiniteQueryOptions, UseInfiniteQueryReturnType } from '@tanstack/vue-query'
import { useQuery, useInfiniteQuery } from '@tanstack/vue-query'
import client from '@kubb/swagger-client/client'
import type { ListPetsBreedQueryResponse, ListPetsBreedPathParams, ListPetsBreedQueryParams } from '../models/ListPetsBreed'

export const listPetsBreedQueryKey = (breed: ListPetsBreedPathParams['breed'], params?: ListPetsBreedQueryParams) =>
  [`/pets/${breed}`, ...(params ? [params] : [])] as const

export function listPetsBreedQueryOptions<TData = ListPetsBreedQueryResponse, TError = unknown>(
  breed: ListPetsBreedPathParams['breed'],
  params?: ListPetsBreedQueryParams,
  options: Partial<Parameters<typeof client>[0]> = {},
): UseQueryOptions<TData, TError> {
  const queryKey = listPetsBreedQueryKey(breed, params)

  return {
    queryKey,
    queryFn: () => {
      return client<TData, TError>({
        method: 'get',
        url: `/pets/${breed}`,
        params,
        ...options,
      })
    },
  }
}

/**
 * @summary List all pets with breed
 * @link /pets/:breed
 */
export function useListPetsBreed<TData = ListPetsBreedQueryResponse, TError = unknown>(
  breed: ListPetsBreedPathParams['breed'],
  params?: ListPetsBreedQueryParams,
  options?: { query?: UseQueryOptions<TData, TError> },
): UseQueryReturnType<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? listPetsBreedQueryKey(breed, params)

  const query = useQuery<TData, TError>({
    ...listPetsBreedQueryOptions<TData, TError>(breed, params),
    ...queryOptions,
  }) as UseQueryReturnType<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey as QueryKey

  return query
}

export function listPetsBreedQueryOptionsInfinite<TData = ListPetsBreedQueryResponse, TError = unknown>(
  breed: ListPetsBreedPathParams['breed'],
  params?: ListPetsBreedQueryParams,
  options: Partial<Parameters<typeof client>[0]> = {},
): UseInfiniteQueryOptions<TData, TError> {
  const queryKey = listPetsBreedQueryKey(breed, params)

  return {
    queryKey,
    queryFn: ({ pageParam }) => {
      return client<TData, TError>({
        method: 'get',
        url: `/pets/${breed}`,
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
 * @summary List all pets with breed
 * @link /pets/:breed
 */
export function useListPetsBreedInfinite<TData = ListPetsBreedQueryResponse, TError = unknown>(
  breed: ListPetsBreedPathParams['breed'],
  params?: ListPetsBreedQueryParams,
  options?: { query?: UseInfiniteQueryOptions<TData, TError> },
): UseInfiniteQueryReturnType<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? listPetsBreedQueryKey(breed, params)

  const query = useInfiniteQuery<TData, TError>({
    ...listPetsBreedQueryOptionsInfinite<TData, TError>(breed, params),
    ...queryOptions,
  }) as UseInfiniteQueryReturnType<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey as QueryKey

  return query
}
