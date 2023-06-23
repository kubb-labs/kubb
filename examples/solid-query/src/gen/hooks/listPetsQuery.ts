import type { QueryKey, CreateQueryResult, CreateQueryOptions, CreateInfiniteQueryOptions, CreateInfiniteQueryResult } from '@tanstack/solid-query'
import { createQuery, createInfiniteQuery } from '@tanstack/solid-query'
import client from '@kubb/swagger-client/client'
import type { ListPetsQueryResponse, ListPetsQueryParams } from '../models/ListPets'

export const listPetsQueryKey = (params: ListPetsQueryParams) => [`/pets`, ...(params ? [params] : [])] as const

export function listPetsQueryOptions<TData = ListPetsQueryResponse, TError = unknown>(params: ListPetsQueryParams): CreateQueryOptions<TData, TError> {
  const queryKey = () => listPetsQueryKey(params)

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

/**
 * @summary List all pets
 * @link /pets
 */
export function listPetsQuery<TData = ListPetsQueryResponse, TError = unknown>(
  params: ListPetsQueryParams,
  options?: { query?: CreateQueryOptions<TData, TError> }
): CreateQueryResult<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions } = options ?? {}
  const queryKey = queryOptions?.queryKey?.() ?? listPetsQueryKey(params)

  const query = createQuery<TData, TError>({
    ...listPetsQueryOptions<TData, TError>(params),
    ...queryOptions,
  }) as CreateQueryResult<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey as QueryKey

  return query
}

export function listPetsQueryOptionsInfinite<TData = ListPetsQueryResponse, TError = unknown>(
  params: ListPetsQueryParams
): CreateInfiniteQueryOptions<TData, TError> {
  const queryKey = () => listPetsQueryKey(params)

  return {
    queryKey,
    queryFn: ({ pageParam }) => {
      return client<TData, TError>({
        method: 'get',
        url: `/pets`,
        params: {
          ...params,
          ['id']: pageParam,
        },
      })
    },
  }
}

/**
 * @summary List all pets
 * @link /pets
 */
export function listPetsQueryInfinite<TData = ListPetsQueryResponse, TError = unknown>(
  params: ListPetsQueryParams,
  options?: { query?: CreateInfiniteQueryOptions<TData, TError> }
): CreateInfiniteQueryResult<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions } = options ?? {}
  const queryKey = queryOptions?.queryKey?.() ?? listPetsQueryKey(params)

  const query = createInfiniteQuery<TData, TError>({
    ...listPetsQueryOptionsInfinite<TData, TError>(params),
    ...queryOptions,
  }) as CreateInfiniteQueryResult<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey as QueryKey

  return query
}
