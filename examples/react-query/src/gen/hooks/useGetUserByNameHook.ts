import client from '@kubb/swagger-client/client'
import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import type { GetUserByNameQueryResponse, GetUserByNamePathParams, GetUserByName400, GetUserByName404 } from '../models/GetUserByName'
import type {
  UseBaseQueryOptions,
  UseQueryResult,
  QueryKey,
  WithRequired,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
  InfiniteData,
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
export function getUserByNameQueryOptions<TData = GetUserByName['response'], TQueryData = GetUserByName['response']>(
  username: GetUserByNamePathParams['username'],
  options: GetUserByName['client']['parameters'] = {},
): WithRequired<UseBaseQueryOptions<GetUserByName['response'], GetUserByName['error'], TData, TQueryData>, 'queryKey'> {
  const queryKey = getUserByNameQueryKey(username)
  return {
    queryKey,
    queryFn: async () => {
      const res = await client<GetUserByName['data'], GetUserByName['error']>({
        method: 'get',
        url: `/user/${username}`,
        ...options,
      })
      return res.data
    },
  }
}
/**
 * @summary Get user by user name
 * @link /user/:username
 */
export function useGetUserByNameHook<
  TData = GetUserByName['response'],
  TQueryData = GetUserByName['response'],
  TQueryKey extends QueryKey = GetUserByNameQueryKey,
>(
  username: GetUserByNamePathParams['username'],
  options: {
    query?: Partial<UseBaseQueryOptions<GetUserByName['response'], GetUserByName['error'], TData, TQueryData, TQueryKey>>
    client?: GetUserByName['client']['parameters']
  } = {},
): UseQueryResult<TData, GetUserByName['error']> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getUserByNameQueryKey(username)
  const query = useQuery<GetUserByName['data'], GetUserByName['error'], TData, any>({
    ...getUserByNameQueryOptions<TData, TQueryData>(username, clientOptions),
    queryKey,
    ...queryOptions,
  }) as UseQueryResult<TData, GetUserByName['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
export const getUserByNameInfiniteQueryKey = (username: GetUserByNamePathParams['username']) =>
  [{ url: '/user/:username', params: { username: username } }] as const
export type GetUserByNameInfiniteQueryKey = ReturnType<typeof getUserByNameInfiniteQueryKey>
export function getUserByNameInfiniteQueryOptions<TData = GetUserByName['response'], TQueryData = GetUserByName['response']>(
  username: GetUserByNamePathParams['username'],
  options: GetUserByName['client']['parameters'] = {},
): WithRequired<UseInfiniteQueryOptions<GetUserByName['response'], GetUserByName['error'], TData, TQueryData>, 'queryKey'> {
  const queryKey = getUserByNameInfiniteQueryKey(username)
  return {
    queryKey,
    queryFn: async ({ pageParam }) => {
      const res = await client<GetUserByName['data'], GetUserByName['error']>({
        method: 'get',
        url: `/user/${username}`,
        ...options,
      })
      return res.data
    },
  }
}
/**
 * @summary Get user by user name
 * @link /user/:username
 */
export function useGetUserByNameHookInfinite<
  TData = InfiniteData<GetUserByName['response']>,
  TQueryData = GetUserByName['response'],
  TQueryKey extends QueryKey = GetUserByNameInfiniteQueryKey,
>(
  username: GetUserByNamePathParams['username'],
  options: {
    query?: Partial<UseInfiniteQueryOptions<GetUserByName['response'], GetUserByName['error'], TData, TQueryData, TQueryKey>>
    client?: GetUserByName['client']['parameters']
  } = {},
): UseInfiniteQueryResult<TData, GetUserByName['error']> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getUserByNameInfiniteQueryKey(username)
  const query = useInfiniteQuery<GetUserByName['data'], GetUserByName['error'], TData, any>({
    ...getUserByNameInfiniteQueryOptions<TData, TQueryData>(username, clientOptions),
    queryKey,
    ...queryOptions,
  }) as UseInfiniteQueryResult<TData, GetUserByName['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
