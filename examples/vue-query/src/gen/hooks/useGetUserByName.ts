import client from '@kubb/plugin-client/client'
import type { GetUserByNameQueryResponse, GetUserByNamePathParams, GetUserByName400, GetUserByName404 } from '../models/GetUserByName.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'
import type { QueryKey, QueryObserverOptions } from '@tanstack/vue-query'
import type { MaybeRef } from 'vue'
import { useQuery, queryOptions } from '@tanstack/vue-query'
import { unref } from 'vue'

export const getUserByNameQueryKey = (username: MaybeRef<GetUserByNamePathParams['username']>) =>
  [{ url: '/user/:username', params: { username: username } }] as const

export type GetUserByNameQueryKey = ReturnType<typeof getUserByNameQueryKey>

/**
 * @summary Get user by user name
 * @link /user/:username
 */
async function getUserByName(username: GetUserByNamePathParams['username'], config: Partial<RequestConfig> = {}) {
  const res = await client<GetUserByNameQueryResponse, GetUserByName400 | GetUserByName404, unknown>({
    method: 'GET',
    url: `/user/${username}`,
    baseURL: 'https://petstore3.swagger.io/api/v3',
    ...config,
  })
  return res.data
}

export function getUserByNameQueryOptions(username: MaybeRef<GetUserByNamePathParams['username']>, config: Partial<RequestConfig> = {}) {
  const queryKey = getUserByNameQueryKey(username)
  return queryOptions({
    queryKey,
    queryFn: async () => {
      return getUserByName(unref(username), unref(config))
    },
  })
}

/**
 * @summary Get user by user name
 * @link /user/:username
 */
export function useGetUserByName<
  TData = GetUserByNameQueryResponse,
  TQueryData = GetUserByNameQueryResponse,
  TQueryKey extends QueryKey = GetUserByNameQueryKey,
>(
  username: MaybeRef<GetUserByNamePathParams['username']>,
  options: {
    query?: Partial<QueryObserverOptions<GetUserByNameQueryResponse, GetUserByName400 | GetUserByName404, TData, TQueryData, TQueryKey>>
    client?: Partial<RequestConfig>
  } = {},
) {
  const { query: queryOptions, client: config = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getUserByNameQueryKey(username)
  const query = useQuery({
    ...(getUserByNameQueryOptions(username, config) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, 'queryKey'>),
  }) as ReturnType<typeof query> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
