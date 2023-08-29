import type { QueryKey, UseQueryResult, UseQueryOptions, UseInfiniteQueryOptions, UseInfiniteQueryResult } from '@tanstack/react-query'
import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import client from '@kubb/swagger-client/client'
import type { ListPetsBreedQueryResponse, ListPetsBreedPathParams, ListPetsBreedQueryParams } from '../models/ListPetsBreed'

export const listPetsBreedQueryKey = (breed: ListPetsBreedPathParams['breed'], params?: ListPetsBreedQueryParams) =>
  [`/pets/${breed}`, ...(params ? [params] : [])] as const

export function listPetsBreedQueryOptions<TData = ListPetsBreedQueryResponse, TError = unknown>(
  breed: ListPetsBreedPathParams['breed'],
  params?: ListPetsBreedQueryParams,
): UseQueryOptions<TData, TError> {
  const queryKey = listPetsBreedQueryKey(breed, params)

  return {
    queryKey,
    queryFn: () => {
      return client<TData, TError>({
        method: 'get',
        url: `/pets/${breed}`,
        params,
      })
    },
  }
}

/**
 * @summary List all pets with breed
 * @link /pets/:breed
 */
export function useListPetsBreedHook<TData = ListPetsBreedQueryResponse, TError = unknown>(
  breed: ListPetsBreedPathParams['breed'],
  params?: ListPetsBreedQueryParams,
  options?: { query?: UseQueryOptions<TData, TError> },
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? listPetsBreedQueryKey(breed, params)

  const query = useQuery<TData, TError>({
    ...listPetsBreedQueryOptions<TData, TError>(breed, params),
    ...queryOptions,
  }) as UseQueryResult<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey

  return query
}

export function listPetsBreedQueryOptionsInfinite<TData = ListPetsBreedQueryResponse, TError = unknown>(
  breed: ListPetsBreedPathParams['breed'],
  params?: ListPetsBreedQueryParams,
): UseInfiniteQueryOptions<TData, TError> {
  const queryKey = listPetsBreedQueryKey(breed, params)

  return {
    queryKey,
    queryFn: ({ pageParam }) => {
      return client<TData, TError>({
        method: 'get',
        url: `/pets/${breed}`,
        params: {
          ...params,
          ['id']: pageParam,
        },
      })
    },
  }
}

/**
 * @summary List all pets with breed
 * @link /pets/:breed
 */
export function useListPetsBreedHookInfinite<TData = ListPetsBreedQueryResponse, TError = unknown>(
  breed: ListPetsBreedPathParams['breed'],
  params?: ListPetsBreedQueryParams,
  options?: { query?: UseInfiniteQueryOptions<TData, TError> },
): UseInfiniteQueryResult<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? listPetsBreedQueryKey(breed, params)

  const query = useInfiniteQuery<TData, TError>({
    ...listPetsBreedQueryOptionsInfinite<TData, TError>(breed, params),
    ...queryOptions,
  }) as UseInfiniteQueryResult<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey

  return query
}
