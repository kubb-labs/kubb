import client from '../../../../tanstack-query-client.ts'
import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import type { GetUserByNameQueryResponse, GetUserByNamePathParams, GetUserByName400, GetUserByName404 } from '../../../models/ts/userController/GetUserByName'
import type { UseBaseQueryOptions, UseQueryResult, QueryKey, WithRequired, UseInfiniteQueryOptions, UseInfiniteQueryResult } from '@tanstack/react-query'

type GetUserByNameClient = typeof client<GetUserByNameQueryResponse, GetUserByName400 | GetUserByName404, never>
type GetUserByName = {
  data: GetUserByNameQueryResponse
  error: GetUserByName400 | GetUserByName404
  request: never
  pathParams: GetUserByNamePathParams
  queryParams: never
  headerParams: never
  response: Awaited<ReturnType<GetUserByNameClient>>
  client: {
    paramaters: Partial<Parameters<GetUserByNameClient>[0]>
    return: Awaited<ReturnType<GetUserByNameClient>>
  }
}
export const getUserByNameQueryKey = (username: GetUserByNamePathParams['username']) => [{ url: '/user/:username', params: { username: username } }] as const
export type GetUserByNameQueryKey = ReturnType<typeof getUserByNameQueryKey>
export function getUserByNameQueryOptions<
  TQueryFnData extends GetUserByName['data'] = GetUserByName['data'],
  TError = GetUserByName['error'],
  TData = GetUserByName['response'],
  TQueryData = GetUserByName['response'],
>(
  username: GetUserByNamePathParams['username'],
  options: GetUserByName['client']['paramaters'] = {},
): WithRequired<UseBaseQueryOptions<GetUserByName['response'], TError, TData, TQueryData>, 'queryKey'> {
  const queryKey = getUserByNameQueryKey(username)
  return {
    queryKey,
    queryFn: async () => {
      const res = await client<TQueryFnData, TError>({
        method: 'get',
        url: `/user/${username}`,
        ...options,
      })
      return res
    },
  }
}
/**
 * @summary Get user by user name
 * @link /user/:username */
export function useGetUserByName<
  TQueryFnData extends GetUserByName['data'] = GetUserByName['data'],
  TError = GetUserByName['error'],
  TData = GetUserByName['response'],
  TQueryData = GetUserByName['response'],
  TQueryKey extends QueryKey = GetUserByNameQueryKey,
>(username: GetUserByNamePathParams['username'], options: {
  query?: UseBaseQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
  client?: GetUserByName['client']['paramaters']
} = {}): UseQueryResult<TData, TError> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getUserByNameQueryKey(username)
  const query = useQuery<TQueryFnData, TError, TData, any>({
    ...getUserByNameQueryOptions<TQueryFnData, TError, TData, TQueryData>(username, clientOptions),
    queryKey,
    ...queryOptions,
  }) as UseQueryResult<TData, TError> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
export const getUserByNameInfiniteQueryKey = (username: GetUserByNamePathParams['username']) =>
  [{ url: '/user/:username', params: { username: username } }] as const
export type GetUserByNameInfiniteQueryKey = ReturnType<typeof getUserByNameInfiniteQueryKey>
export function getUserByNameInfiniteQueryOptions<
  TQueryFnData extends GetUserByName['data'] = GetUserByName['data'],
  TError = GetUserByName['error'],
  TData = GetUserByName['response'],
  TQueryData = GetUserByName['response'],
>(
  username: GetUserByNamePathParams['username'],
  options: GetUserByName['client']['paramaters'] = {},
): WithRequired<UseInfiniteQueryOptions<GetUserByName['response'], TError, TData, TQueryData>, 'queryKey'> {
  const queryKey = getUserByNameInfiniteQueryKey(username)
  return {
    queryKey,
    queryFn: async ({ pageParam }) => {
      const res = await client<TQueryFnData, TError>({
        method: 'get',
        url: `/user/${username}`,
        ...options,
      })
      return res
    },
  }
}
/**
 * @summary Get user by user name
 * @link /user/:username */
export function useGetUserByNameInfinite<
  TQueryFnData extends GetUserByName['data'] = GetUserByName['data'],
  TError = GetUserByName['error'],
  TData = GetUserByName['response'],
  TQueryData = GetUserByName['response'],
  TQueryKey extends QueryKey = GetUserByNameInfiniteQueryKey,
>(username: GetUserByNamePathParams['username'], options: {
  query?: UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
  client?: GetUserByName['client']['paramaters']
} = {}): UseInfiniteQueryResult<TData, TError> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getUserByNameInfiniteQueryKey(username)
  const query = useInfiniteQuery<TQueryFnData, TError, TData, any>({
    ...getUserByNameInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryData>(username, clientOptions),
    queryKey,
    ...queryOptions,
  }) as UseInfiniteQueryResult<TData, TError> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
