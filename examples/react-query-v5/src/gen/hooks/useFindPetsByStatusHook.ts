import client from '@kubb/swagger-client/client'
import { useQuery, queryOptions, useInfiniteQuery, infiniteQueryOptions, useSuspenseQuery } from '@tanstack/react-query'
import type { FindPetsByStatusQueryResponse, FindPetsByStatusQueryParams, FindPetsByStatus400 } from '../models/FindPetsByStatus'
import type {
  QueryObserverOptions,
  UseQueryResult,
  QueryKey,
  InfiniteQueryObserverOptions,
  UseInfiniteQueryResult,
  UseSuspenseQueryOptions,
  UseSuspenseQueryResult,
} from '@tanstack/react-query'

type FindPetsByStatusClient = typeof client<FindPetsByStatusQueryResponse, FindPetsByStatus400, never>
type FindPetsByStatus = {
  data: FindPetsByStatusQueryResponse
  error: FindPetsByStatus400
  request: never
  pathParams: never
  queryParams: FindPetsByStatusQueryParams
  headerParams: never
  response: FindPetsByStatusQueryResponse
  client: {
    parameters: Partial<Parameters<FindPetsByStatusClient>[0]>
    return: Awaited<ReturnType<FindPetsByStatusClient>>
  }
}
export const findPetsByStatusQueryKey = (params?: FindPetsByStatus['queryParams']) => [{ url: '/pet/findByStatus' }, ...(params ? [params] : [])] as const
export type FindPetsByStatusQueryKey = ReturnType<typeof findPetsByStatusQueryKey>
export function findPetsByStatusQueryOptions(params?: FindPetsByStatus['queryParams'], options: FindPetsByStatus['client']['parameters'] = {}) {
  const queryKey = findPetsByStatusQueryKey(params)
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<FindPetsByStatus['data'], FindPetsByStatus['error']>({
        method: 'get',
        url: `/pet/findByStatus`,
        params,
        ...options,
      })
      return res.data
    },
  })
}
/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * @link /pet/findByStatus */
export function useFindPetsByStatusHook<
  TData = FindPetsByStatus['response'],
  TQueryData = FindPetsByStatus['response'],
  TQueryKey extends QueryKey = FindPetsByStatusQueryKey,
>(params?: FindPetsByStatus['queryParams'], options: {
  query?: QueryObserverOptions<FindPetsByStatus['data'], FindPetsByStatus['error'], TData, TQueryData, TQueryKey>
  client?: FindPetsByStatus['client']['parameters']
} = {}): UseQueryResult<TData, FindPetsByStatus['error']> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? findPetsByStatusQueryKey(params)
  const query = useQuery({
    ...findPetsByStatusQueryOptions(params, clientOptions),
    queryKey,
    ...queryOptions as QueryObserverOptions,
  }) as UseQueryResult<TData, FindPetsByStatus['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
export const findPetsByStatusInfiniteQueryKey = (params?: FindPetsByStatus['queryParams']) =>
  [{ url: '/pet/findByStatus' }, ...(params ? [params] : [])] as const
export type FindPetsByStatusInfiniteQueryKey = ReturnType<typeof findPetsByStatusInfiniteQueryKey>
export function findPetsByStatusInfiniteQueryOptions(params?: FindPetsByStatus['queryParams'], options: FindPetsByStatus['client']['parameters'] = {}) {
  const queryKey = findPetsByStatusInfiniteQueryKey(params)
  return infiniteQueryOptions({
    queryKey,
    queryFn: async ({ pageParam }) => {
      const res = await client<FindPetsByStatus['data'], FindPetsByStatus['error']>({
        method: 'get',
        url: `/pet/findByStatus`,
        ...options,
        params: {
          ...params,
          ['id']: pageParam,
          ...(options.params || {}),
        },
      })
      return res.data
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage['id'],
  })
}
/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * @link /pet/findByStatus */
export function useFindPetsByStatusHookInfinite<
  TData = FindPetsByStatus['response'],
  TQueryData = FindPetsByStatus['response'],
  TQueryKey extends QueryKey = FindPetsByStatusInfiniteQueryKey,
>(params?: FindPetsByStatus['queryParams'], options: {
  query?: InfiniteQueryObserverOptions<FindPetsByStatus['data'], FindPetsByStatus['error'], TData, TQueryData, TQueryKey>
  client?: FindPetsByStatus['client']['parameters']
} = {}): UseInfiniteQueryResult<TData, FindPetsByStatus['error']> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? findPetsByStatusInfiniteQueryKey(params)
  const query = useInfiniteQuery({
    ...findPetsByStatusInfiniteQueryOptions(params, clientOptions),
    queryKey,
    ...queryOptions as InfiniteQueryObserverOptions,
  }) as UseInfiniteQueryResult<TData, FindPetsByStatus['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
export const findPetsByStatusSuspenseQueryKey = (params?: FindPetsByStatus['queryParams']) =>
  [{ url: '/pet/findByStatus' }, ...(params ? [params] : [])] as const
export type FindPetsByStatusSuspenseQueryKey = ReturnType<typeof findPetsByStatusSuspenseQueryKey>
export function findPetsByStatusSuspenseQueryOptions(params?: FindPetsByStatus['queryParams'], options: FindPetsByStatus['client']['parameters'] = {}) {
  const queryKey = findPetsByStatusSuspenseQueryKey(params)
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<FindPetsByStatus['data'], FindPetsByStatus['error']>({
        method: 'get',
        url: `/pet/findByStatus`,
        params,
        ...options,
      })
      return res.data
    },
  })
}
/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * @link /pet/findByStatus */
export function useFindPetsByStatusHookSuspense<TData = FindPetsByStatus['response'], TQueryKey extends QueryKey = FindPetsByStatusSuspenseQueryKey>(
  params?: FindPetsByStatus['queryParams'],
  options: {
    query?: UseSuspenseQueryOptions<FindPetsByStatus['data'], FindPetsByStatus['error'], TData, TQueryKey>
    client?: FindPetsByStatus['client']['parameters']
  } = {},
): UseSuspenseQueryResult<TData, FindPetsByStatus['error']> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? findPetsByStatusSuspenseQueryKey(params)
  const query = useSuspenseQuery({
    ...findPetsByStatusSuspenseQueryOptions(params, clientOptions),
    queryKey,
    ...queryOptions as QueryObserverOptions,
  }) as UseSuspenseQueryResult<TData, FindPetsByStatus['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
