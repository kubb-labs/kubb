import client from '@kubb/plugin-client/clients/axios'
import type { GetUserByNameQueryResponse, GetUserByNamePathParams, GetUserByName400, GetUserByName404 } from '../models/GetUserByName.ts'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { QueryKey, CreateBaseQueryOptions, CreateQueryResult } from '@tanstack/svelte-query'
import { queryOptions, createQuery } from '@tanstack/svelte-query'

export const getUserByNameQueryKey = (username: GetUserByNamePathParams['username']) => [{ url: '/user/:username', params: { username: username } }] as const

export type GetUserByNameQueryKey = ReturnType<typeof getUserByNameQueryKey>

/**
 * @summary Get user by user name
 * {@link /user/:username}
 */
async function getUserByName(username: GetUserByNamePathParams['username'], config: Partial<RequestConfig> = {}) {
  const res = await client<GetUserByNameQueryResponse, ResponseErrorConfig<GetUserByName400 | GetUserByName404>, unknown>({
    method: 'GET',
    url: `/user/${username}`,
    ...config,
  })
  return res.data
}

export function getUserByNameQueryOptions(username: GetUserByNamePathParams['username'], config: Partial<RequestConfig> = {}) {
  const queryKey = getUserByNameQueryKey(username)
  return queryOptions<GetUserByNameQueryResponse, ResponseErrorConfig<GetUserByName400 | GetUserByName404>, GetUserByNameQueryResponse, typeof queryKey>({
    enabled: !!username,
    queryKey,
    queryFn: async ({ signal }) => {
      config.signal = signal
      return getUserByName(username, config)
    },
  })
}

/**
 * @summary Get user by user name
 * {@link /user/:username}
 */
export function createGetUserByName<
  TData = GetUserByNameQueryResponse,
  TQueryData = GetUserByNameQueryResponse,
  TQueryKey extends QueryKey = GetUserByNameQueryKey,
>(
  username: GetUserByNamePathParams['username'],
  options: {
    query?: Partial<CreateBaseQueryOptions<GetUserByNameQueryResponse, ResponseErrorConfig<GetUserByName400 | GetUserByName404>, TData, TQueryData, TQueryKey>>
    client?: Partial<RequestConfig>
  } = {},
) {
  const { query: queryOptions, client: config = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getUserByNameQueryKey(username)

  const query = createQuery({
    ...(getUserByNameQueryOptions(username, config) as unknown as CreateBaseQueryOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<CreateBaseQueryOptions, 'queryKey'>),
  }) as CreateQueryResult<TData, ResponseErrorConfig<GetUserByName400 | GetUserByName404>> & { queryKey: TQueryKey }

  query.queryKey = queryKey as TQueryKey

  return query
}
