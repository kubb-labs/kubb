import client from '@kubb/plugin-client/client'
import type { GetUserByNameQueryResponse, GetUserByNamePathParams, GetUserByName400, GetUserByName404 } from '../models/GetUserByName.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'
import type { QueryKey, CreateBaseQueryOptions, CreateQueryResult } from '@tanstack/solid-query'
import { queryOptions, createQuery } from '@tanstack/solid-query'

export const getUserByNameQueryKey = (username: GetUserByNamePathParams['username']) => [{ url: '/user/:username', params: { username: username } }] as const

export type GetUserByNameQueryKey = ReturnType<typeof getUserByNameQueryKey>

/**
 * @summary Get user by user name
 * @link /user/:username
 */
async function getUserByName(username: GetUserByNamePathParams['username'], config: Partial<RequestConfig> = {}) {
  const res = await client<GetUserByNameQueryResponse, GetUserByName400 | GetUserByName404, unknown>({ method: 'GET', url: `/user/${username}`, ...config })
  return res.data
}

export function getUserByNameQueryOptions(username: GetUserByNamePathParams['username'], config: Partial<RequestConfig> = {}) {
  const queryKey = getUserByNameQueryKey(username)
  return queryOptions({
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
 * @link /user/:username
 */
export function createGetUserByName<
  TData = GetUserByNameQueryResponse,
  TQueryData = GetUserByNameQueryResponse,
  TQueryKey extends QueryKey = GetUserByNameQueryKey,
>(
  username: GetUserByNamePathParams['username'],
  options: {
    query?: Partial<CreateBaseQueryOptions<GetUserByNameQueryResponse, GetUserByName400 | GetUserByName404, TData, TQueryData, TQueryKey>>
    client?: Partial<RequestConfig>
  } = {},
) {
  const { query: queryOptions, client: config = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getUserByNameQueryKey(username)
  const query = createQuery(() => ({
    ...(getUserByNameQueryOptions(username, config) as unknown as CreateBaseQueryOptions),
    queryKey,
    initialData: null,
    ...(queryOptions as unknown as Omit<CreateBaseQueryOptions, 'queryKey'>),
  })) as CreateQueryResult<TData, GetUserByName400 | GetUserByName404> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
