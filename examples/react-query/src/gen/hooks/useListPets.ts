import type {
  QueryKey,
  UseQueryResult,
  UseQueryOptions,
  QueryOptions,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult} from '@tanstack/react-query';
import {
  useQuery,
  useInfiniteQuery,
} from '@tanstack/react-query'
import client from '@kubb/swagger-client/client'
import type { ListPetsQueryResponse, ListPetsQueryParams } from '../models/ListPets'

export const listPetsQueryKey = (params?: ListPetsQueryParams) => [`/pets`, ...(params ? [params] : [])] as const

export function listPetsQueryOptions<TData = ListPetsQueryResponse, TError = unknown>(params?: ListPetsQueryParams): QueryOptions<TData, TError> {
  const queryKey = listPetsQueryKey(params)

  return {
    queryKey,
    queryFn: () => {
      return client<TData, TError>({
        method: 'get',
        url: `/pets`,
        params,
      })
    },
  }
}

export function listPetsQueryOptionsInfinite<TData = ListPetsQueryResponse, TError = unknown>(
  params?: ListPetsQueryParams
): UseInfiniteQueryOptions<TData, TError> {
  const queryKey = listPetsQueryKey(params)

  return {
    queryKey,
    queryFn: ({ pageParam }) => {
      return client<TData, TError>({
        method: 'get',
        url: `/pets`,
        params: {
          ...params,
          ['param']: pageParam,
        },
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
  options?: { query?: UseQueryOptions<TData, TError> }
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? listPetsQueryKey(params)

  const query = useQuery<TData, TError>({
    ...listPetsQueryOptions<TData, TError>(params),
    ...queryOptions,
  }) as UseQueryResult<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey 

  return query
}

/**
 * @summary List all pets
 * @link /pets
 */
export function useListPetsInfinite<TData = ListPetsQueryResponse, TError = unknown>(
  params?: ListPetsQueryParams,
  options?: { query?: UseInfiniteQueryOptions<TData, TError> }
): UseInfiniteQueryOptions<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? listPetsQueryKey(params)

  const query = useInfiniteQuery<TData, TError>({
    ...listPetsQueryOptionsInfinite<TData, TError>(params),
    ...queryOptions,
  }) as UseInfiniteQueryResult<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey 

  return query
}
