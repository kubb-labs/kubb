import client from '@kubb/swagger-client/client'

import { infiniteQueryOptions, queryOptions, useInfiniteQuery, useQuery } from '@tanstack/react-query'

import type {
  InfiniteData,
  InfiniteQueryObserverOptions,
  QueryKey,
  QueryObserverOptions,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query'
import type { FindPetsByStatus400, FindPetsByStatusQueryParams, FindPetsByStatusQueryResponse } from '../models/FindPetsByStatus'

export const findPetsByStatusQueryKey = (params?: FindPetsByStatusQueryParams) => [{ url: `/pet/findByStatus` }, ...(params ? [params] : [])] as const
export function findPetsByStatusQueryOptions<TData = FindPetsByStatusQueryResponse, TError = FindPetsByStatus400>(
  params?: FindPetsByStatusQueryParams,
  options: Partial<Parameters<typeof client>[0]> = {},
): UseQueryOptions<TData, TError> {
  const queryKey = findPetsByStatusQueryKey(params)
  return queryOptions<TData, TError>({
    queryKey: queryKey as QueryKey,
    queryFn: () => {
      return client<TData, TError>({
        method: 'get',
        url: `/pet/findByStatus`,
        params,
        ...options,
      }).then(res => res.data)
    },
  })
}

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * @link /pet/findByStatus
 */
export function useFindPetsByStatusHook<TData = FindPetsByStatusQueryResponse, TError = FindPetsByStatus400>(params?: FindPetsByStatusQueryParams, options: {
  query?: QueryObserverOptions<TData, TError>
  client?: Partial<Parameters<typeof client<TData, TError>>[0]>
} = {}): UseQueryResult<TData, TError> & {
  queryKey: QueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? findPetsByStatusQueryKey(params)
  const query = useQuery<TData, TError>({
    ...findPetsByStatusQueryOptions<TData, TError>(params, clientOptions),
    ...queryOptions,
  }) as UseQueryResult<TData, TError> & {
    queryKey: QueryKey
  }
  query.queryKey = queryKey
  return query
}

export function findPetsByStatusQueryOptionsInfinite<
  TData = FindPetsByStatusQueryResponse,
  TError = FindPetsByStatus400,
  TInfiniteDate = InfiniteData<FindPetsByStatusQueryResponse extends [] ? FindPetsByStatusQueryResponse[number] : FindPetsByStatusQueryResponse>,
>(params?: FindPetsByStatusQueryParams, options: Partial<Parameters<typeof client>[0]> = {}): UseInfiniteQueryOptions<TData, TError, TInfiniteDate> {
  const queryKey = findPetsByStatusQueryKey(params)
  return infiniteQueryOptions<TData, TError, TInfiniteDate>({
    queryKey,
    queryFn: ({ pageParam }) => {
      return client<TData, TError>({
        method: 'get',
        url: `/pet/findByStatus`,
        ...options,
        params: {
          ...params,
          ['id']: pageParam,
          ...(options.params || {}),
        },
      }).then(res => res.data)
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage['id'],
  })
}

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * @link /pet/findByStatus
 */
export function useFindPetsByStatusHookInfinite<
  TData = FindPetsByStatusQueryResponse,
  TError = FindPetsByStatus400,
  TInfiniteDate = InfiniteData<FindPetsByStatusQueryResponse extends [] ? FindPetsByStatusQueryResponse[number] : FindPetsByStatusQueryResponse>,
>(params?: FindPetsByStatusQueryParams, options: {
  query?: InfiniteQueryObserverOptions<TData, TError, TInfiniteDate>
  client?: Partial<Parameters<typeof client<TData, TError>>[0]>
} = {}): UseInfiniteQueryResult<TData, TError> & {
  queryKey: QueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? findPetsByStatusQueryKey(params)
  const query = useInfiniteQuery<TData, TError, TInfiniteDate>({
    ...findPetsByStatusQueryOptionsInfinite<TData, TError, TInfiniteDate>(params, clientOptions),
    ...queryOptions,
  }) as UseInfiniteQueryResult<TData, TError> & {
    queryKey: QueryKey
  }
  query.queryKey = queryKey
  return query
}
