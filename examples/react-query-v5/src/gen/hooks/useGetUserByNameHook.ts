import client from '@kubb/swagger-client/client'
import { useQuery, queryOptions, useInfiniteQuery, infiniteQueryOptions, useSuspenseQuery } from '@tanstack/react-query'
import type { GetUserByNameQueryResponse, GetUserByNamePathParams, GetUserByName400, GetUserByName404 } from '../models/GetUserByName'
import type {
  QueryObserverOptions,
  UseQueryResult,
  QueryKey,
  InfiniteQueryObserverOptions,
  UseInfiniteQueryResult,
  UseSuspenseQueryOptions,
  UseSuspenseQueryResult,
} from '@tanstack/react-query'

type GetUserByNameClient = typeof client<GetUserByNameQueryResponse, GetUserByName400 | GetUserByName404, never>
type GetUserByName = {
  data: GetUserByNameQueryResponse
  error: GetUserByName400 | GetUserByName404
  request: never
  pathParams: GetUserByNamePathParams
  queryParams: never
  headerParams: never
  response: GetUserByNameQueryResponse
  client: {
    parameters: Partial<Parameters<GetUserByNameClient>[0]>
    return: Awaited<ReturnType<GetUserByNameClient>>
  }
}
export const getUserByNameQueryKey = (username: GetUserByNamePathParams['username']) => [{ url: '/user/:username', params: { username: username } }] as const
export type GetUserByNameQueryKey = ReturnType<typeof getUserByNameQueryKey>
export function getUserByNameQueryOptions(username: GetUserByNamePathParams['username'], options: GetUserByName['client']['parameters'] = {}) {
  const queryKey = getUserByNameQueryKey(username)
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<GetUserByName['data'], GetUserByName['error']>({
        method: 'get',
        url: `/user/${username}`,
        ...options,
      })
      return res.data
    },
  })
}
/**
 * @summary Get user by user name
 * @link /user/:username */
export function useGetUserByNameHook<
  TData = GetUserByName['response'],
  TQueryData = GetUserByName['response'],
  TQueryKey extends QueryKey = GetUserByNameQueryKey,
>(username: GetUserByNamePathParams['username'], options: {
  query?: QueryObserverOptions<GetUserByName['data'], GetUserByName['error'], TData, TQueryData, TQueryKey>
  client?: GetUserByName['client']['parameters']
} = {}): UseQueryResult<TData, GetUserByName['error']> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getUserByNameQueryKey(username)
  const query = useQuery({
    ...getUserByNameQueryOptions(username, clientOptions),
    queryKey,
    ...queryOptions as QueryObserverOptions,
  }) as UseQueryResult<TData, GetUserByName['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
export const getUserByNameInfiniteQueryKey = (username: GetUserByNamePathParams['username']) =>
  [{ url: '/user/:username', params: { username: username } }] as const
export type GetUserByNameInfiniteQueryKey = ReturnType<typeof getUserByNameInfiniteQueryKey>
export function getUserByNameInfiniteQueryOptions(username: GetUserByNamePathParams['username'], options: GetUserByName['client']['parameters'] = {}) {
  const queryKey = getUserByNameInfiniteQueryKey(username)
  return infiniteQueryOptions({
    queryKey,
    queryFn: async ({ pageParam }) => {
      const res = await client<GetUserByName['data'], GetUserByName['error']>({
        method: 'get',
        url: `/user/${username}`,
        ...options,
      })
      return res.data
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage['id'],
  })
}
/**
 * @summary Get user by user name
 * @link /user/:username */
export function useGetUserByNameHookInfinite<
  TData = GetUserByName['response'],
  TQueryData = GetUserByName['response'],
  TQueryKey extends QueryKey = GetUserByNameInfiniteQueryKey,
>(username: GetUserByNamePathParams['username'], options: {
  query?: InfiniteQueryObserverOptions<GetUserByName['data'], GetUserByName['error'], TData, TQueryData, TQueryKey>
  client?: GetUserByName['client']['parameters']
} = {}): UseInfiniteQueryResult<TData, GetUserByName['error']> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getUserByNameInfiniteQueryKey(username)
  const query = useInfiniteQuery({
    ...getUserByNameInfiniteQueryOptions(username, clientOptions),
    queryKey,
    ...queryOptions as InfiniteQueryObserverOptions,
  }) as UseInfiniteQueryResult<TData, GetUserByName['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
export const getUserByNameSuspenseQueryKey = (username: GetUserByNamePathParams['username']) =>
  [{ url: '/user/:username', params: { username: username } }] as const
export type GetUserByNameSuspenseQueryKey = ReturnType<typeof getUserByNameSuspenseQueryKey>
export function getUserByNameSuspenseQueryOptions(username: GetUserByNamePathParams['username'], options: GetUserByName['client']['parameters'] = {}) {
  const queryKey = getUserByNameSuspenseQueryKey(username)
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<GetUserByName['data'], GetUserByName['error']>({
        method: 'get',
        url: `/user/${username}`,
        ...options,
      })
      return res.data
    },
  })
}
/**
 * @summary Get user by user name
 * @link /user/:username */
export function useGetUserByNameHookSuspense<TData = GetUserByName['response'], TQueryKey extends QueryKey = GetUserByNameSuspenseQueryKey>(
  username: GetUserByNamePathParams['username'],
  options: {
    query?: UseSuspenseQueryOptions<GetUserByName['data'], GetUserByName['error'], TData, TQueryKey>
    client?: GetUserByName['client']['parameters']
  } = {},
): UseSuspenseQueryResult<TData, GetUserByName['error']> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getUserByNameSuspenseQueryKey(username)
  const query = useSuspenseQuery({
    ...getUserByNameSuspenseQueryOptions(username, clientOptions),
    queryKey,
    ...queryOptions as QueryObserverOptions,
  }) as UseSuspenseQueryResult<TData, GetUserByName['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
