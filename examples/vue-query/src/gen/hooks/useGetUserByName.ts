import client from '@kubb/plugin-client/clients/axios'
import type { GetUserByNameQueryResponse, GetUserByNamePathParams, GetUserByName400, GetUserByName404 } from '../models/GetUserByName.ts'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { QueryKey, QueryObserverOptions, UseQueryReturnType } from '@tanstack/vue-query'
import type { MaybeRef } from 'vue'
import { queryOptions, useQuery } from '@tanstack/vue-query'
import { unref } from 'vue'

export const getUserByNameQueryKey = ({ username }: { username: MaybeRef<GetUserByNamePathParams['username']> }) =>
  [{ url: '/user/:username', params: { username: username } }] as const

export type GetUserByNameQueryKey = ReturnType<typeof getUserByNameQueryKey>

/**
 * @summary Get user by user name
 * {@link /user/:username}
 */
export async function getUserByName(
  { username }: { username: GetUserByNamePathParams['username'] },
  config: Partial<RequestConfig> & { client?: typeof client } = {},
) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<GetUserByNameQueryResponse, ResponseErrorConfig<GetUserByName400 | GetUserByName404>, unknown>({
    method: 'GET',
    url: `/user/${username}`,
    ...requestConfig,
  })
  return res.data
}

export function getUserByNameQueryOptions(
  { username }: { username: MaybeRef<GetUserByNamePathParams['username']> },
  config: Partial<RequestConfig> & { client?: typeof client } = {},
) {
  const queryKey = getUserByNameQueryKey({ username })
  return queryOptions<GetUserByNameQueryResponse, ResponseErrorConfig<GetUserByName400 | GetUserByName404>, GetUserByNameQueryResponse, typeof queryKey>({
    enabled: !!username,
    queryKey,
    queryFn: async ({ signal }) => {
      config.signal = signal
      return getUserByName(unref({ username: unref(username) }), unref(config))
    },
  })
}

/**
 * @summary Get user by user name
 * {@link /user/:username}
 */
export function useGetUserByName<
  TData = GetUserByNameQueryResponse,
  TQueryData = GetUserByNameQueryResponse,
  TQueryKey extends QueryKey = GetUserByNameQueryKey,
>(
  { username }: { username: MaybeRef<GetUserByNamePathParams['username']> },
  options: {
    query?: Partial<QueryObserverOptions<GetUserByNameQueryResponse, ResponseErrorConfig<GetUserByName400 | GetUserByName404>, TData, TQueryData, TQueryKey>>
    client?: Partial<RequestConfig> & { client?: typeof client }
  } = {},
) {
  const { query: queryOptions, client: config = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getUserByNameQueryKey({ username })

  const query = useQuery({
    ...(getUserByNameQueryOptions({ username }, config) as unknown as QueryObserverOptions),
    queryKey: queryKey as QueryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, 'queryKey'>),
  }) as UseQueryReturnType<TData, ResponseErrorConfig<GetUserByName400 | GetUserByName404>> & { queryKey: TQueryKey }

  query.queryKey = queryKey as TQueryKey

  return query
}
