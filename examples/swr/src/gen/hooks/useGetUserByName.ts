import client from '@kubb/plugin-client/client'
import useSWR from 'swr'
import type { GetUserByNameQueryResponse, GetUserByNamePathParams, GetUserByName400, GetUserByName404 } from '../models/GetUserByName.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'
import type { SWRConfiguration } from 'swr'

/**
 * @summary Get user by user name
 * @link /user/:username
 */
async function getUserByName(username: GetUserByNamePathParams['username'], config: Partial<RequestConfig> = {}) {
  const res = await client<GetUserByNameQueryResponse, GetUserByName400 | GetUserByName404, unknown>({
    method: 'get',
    url: `/user/${username}`,
    baseURL: 'https://petstore3.swagger.io/api/v3',
    ...config,
  })
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
 * @link /user/:username
 */
export function useGetUserByName<TData = GetUserByNameQueryResponse>(
  username: GetUserByNamePathParams['username'],
  options: {
    query?: SWRConfiguration<TData, GetUserByName400 | GetUserByName404>
    client?: Partial<RequestConfig>
    shouldFetch?: boolean
  } = {},
) {
  const { query: queryOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const url = `/user/${username}`
  return useSWR<TData, GetUserByName400 | GetUserByName404, typeof url | null>(shouldFetch ? url : null, {
    ...getUserByNameQueryOptions(username, config),
    ...queryOptions,
  })
}
