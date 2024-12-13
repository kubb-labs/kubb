import client from '@kubb/plugin-client/clients/axios'
import useSWR from 'swr'
import type { GetUserByNameQueryResponse, GetUserByNamePathParams, GetUserByName400, GetUserByName404 } from '../models/GetUserByName.ts'
import type { RequestConfig } from '@kubb/plugin-client/clients/axios'

export const getUserByNameQueryKey = (username: GetUserByNamePathParams['username']) => [{ url: '/user/:username', params: { username: username } }] as const

export type GetUserByNameQueryKey = ReturnType<typeof getUserByNameQueryKey>

/**
 * @summary Get user by user name
 * {@link /user/:username}
 */
async function getUserByName(username: GetUserByNamePathParams['username'], config: Partial<RequestConfig> = {}) {
  const res = await client<GetUserByNameQueryResponse, GetUserByName400 | GetUserByName404, unknown>({ method: 'GET', url: `/user/${username}`, ...config })
  return res.data
}

export function getUserByNameQueryOptions(username: GetUserByNamePathParams['username'], config: Partial<RequestConfig> = {}) {
  return {
    fetcher: async () => {
      return getUserByName(username, config)
    },
  }
}

/**
 * @summary Get user by user name
 * {@link /user/:username}
 */
export function useGetUserByName(
  username: GetUserByNamePathParams['username'],
  options: {
    query?: Parameters<typeof useSWR<GetUserByNameQueryResponse, GetUserByName400 | GetUserByName404, GetUserByNameQueryKey | null, any>>[2]
    client?: Partial<RequestConfig>
    shouldFetch?: boolean
  } = {},
) {
  const { query: queryOptions, client: config = {}, shouldFetch = true } = options ?? {}

  const queryKey = getUserByNameQueryKey(username)

  return useSWR<GetUserByNameQueryResponse, GetUserByName400 | GetUserByName404, GetUserByNameQueryKey | null>(shouldFetch ? queryKey : null, {
    ...getUserByNameQueryOptions(username, config),
    ...queryOptions,
  })
}
