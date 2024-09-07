import client from '@kubb/plugin-client/client'
import type { GetUserByNameQueryResponse, GetUserByNamePathParams, GetUserByName400, GetUserByName404 } from '../models/GetUserByName.ts'
import type { QueryKey, QueryObserverOptions, UseQueryResult } from '@tanstack/react-query'
import { useQuery, queryOptions } from '@tanstack/react-query'

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

export const getUserByNameQueryKey = (username: GetUserByNamePathParams['username']) =>
  ['v5', { url: '/user/:username', params: { username: username } }] as const

export type GetUserByNameQueryKey = ReturnType<typeof getUserByNameQueryKey>

export function getUserByNameQueryOptions(username: GetUserByNamePathParams['username'], options: Partial<Parameters<typeof client>[0]> = {}) {
  const queryKey = getUserByNameQueryKey(username)
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<GetUserByName['data'], GetUserByName['error']>({ method: 'get', url: `/user/${username}`, ...options })
      return res.data
    },
  })
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
  options?: {
    query?: Partial<QueryObserverOptions<GetUserByName['response'], GetUserByName['error'], TData, TQueryData, TQueryKey>>
    client?: GetUserByName['client']['parameters']
  },
): UseQueryResult<TData, GetUserByName['error']> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getUserByNameQueryKey(username)
  const query = useQuery({
    ...(getUserByNameQueryOptions(username, clientOptions) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, 'queryKey'>),
  }) as UseQueryResult<TData, GetUserByName['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
