import type { GetUserByNameQueryResponse, GetUserByNamePathParams, GetUserByName400, GetUserByName404 } from '../models/GetUserByName'
import type {
  CreateBaseQueryOptions,
  CreateQueryResult,
  QueryKey,
  CreateInfiniteQueryOptions,
  CreateInfiniteQueryResult,
  InfiniteData,
} from '@tanstack/svelte-query'
import client from '@kubb/plugin-client/client'
import { createQuery, queryOptions, createInfiniteQuery, infiniteQueryOptions } from '@tanstack/svelte-query'

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
 * @link /user/:username
 */
export function getUserByNameQuery<
  TData = GetUserByName['response'],
  TQueryData = GetUserByName['response'],
  TQueryKey extends QueryKey = GetUserByNameQueryKey,
>(
  username: GetUserByNamePathParams['username'],
  options: {
    query?: Partial<CreateBaseQueryOptions<GetUserByName['response'], GetUserByName['error'], TData, TQueryData, TQueryKey>>
    client?: GetUserByName['client']['parameters']
  } = {},
): CreateQueryResult<TData, GetUserByName['error']> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getUserByNameQueryKey(username)
  const query = createQuery({
    ...(getUserByNameQueryOptions(username, clientOptions) as unknown as CreateBaseQueryOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<CreateBaseQueryOptions, 'queryKey'>),
  }) as CreateQueryResult<TData, GetUserByName['error']> & {
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
    getNextPageParam: (lastPage, _allPages, lastPageParam) => (Array.isArray(lastPage) && lastPage.length === 0 ? undefined : lastPageParam + 1),
    getPreviousPageParam: (_firstPage, _allPages, firstPageParam) => (firstPageParam <= 1 ? undefined : firstPageParam - 1),
  })
}

/**
 * @summary Get user by user name
 * @link /user/:username
 */
export function getUserByNameQueryInfinite<
  TData = InfiniteData<GetUserByName['response']>,
  TQueryData = GetUserByName['response'],
  TQueryKey extends QueryKey = GetUserByNameInfiniteQueryKey,
>(
  username: GetUserByNamePathParams['username'],
  options: {
    query?: Partial<CreateInfiniteQueryOptions<GetUserByName['response'], GetUserByName['error'], TData, TQueryData, TQueryKey>>
    client?: GetUserByName['client']['parameters']
  } = {},
): CreateInfiniteQueryResult<TData, GetUserByName['error']> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getUserByNameInfiniteQueryKey(username)
  const query = createInfiniteQuery({
    ...(getUserByNameInfiniteQueryOptions(username, clientOptions) as unknown as CreateInfiniteQueryOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<CreateInfiniteQueryOptions, 'queryKey'>),
  }) as CreateInfiniteQueryResult<TData, GetUserByName['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
