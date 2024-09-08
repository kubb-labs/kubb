import client from '../../../../swr-client.ts'
import useSWR from 'swr'
import type { RequestConfig } from '../../../../swr-client.ts'
import type {
  GetUserByNameQueryResponse,
  GetUserByNamePathParams,
  GetUserByName400,
  GetUserByName404,
} from '../../../models/ts/userController/GetUserByName.ts'
import type { Key, SWRConfiguration } from 'swr'
import { getUserByNameQueryResponseSchema } from '../../../zod/userController/getUserByNameSchema.ts'

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
  return getUserByNameQueryResponseSchema.parse(res.data)
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
export function useGetUserByName(
  username: GetUserByNamePathParams['username'],
  options: {
    query?: SWRConfiguration<GetUserByNameQueryResponse, GetUserByName400 | GetUserByName404>
    client?: Partial<RequestConfig>
    shouldFetch?: boolean
  } = {},
) {
  const { query: queryOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const swrKey = [`/user/${username}`] as const
  return useSWR<GetUserByNameQueryResponse, GetUserByName400 | GetUserByName404, Key>(shouldFetch ? swrKey : null, {
    ...getUserByNameQueryOptions(username, config),
    ...queryOptions,
  })
}
