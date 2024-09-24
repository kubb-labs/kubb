import client from '../../../../swr-client.ts'
import useSWR from 'swr'
import type { RequestConfig } from '../../../../swr-client.ts'
import type { LogoutUserQueryResponse } from '../../../models/ts/userController/LogoutUser.ts'
import type { Key, SWRConfiguration } from 'swr'
import { logoutUserQueryResponseSchema } from '../../../zod/userController/logoutUserSchema.ts'

export const logoutUserQueryKey = () => [{ url: '/user/logout' }] as const

export type LogoutUserQueryKey = ReturnType<typeof logoutUserQueryKey>

/**
 * @summary Logs out current logged in user session
 * @link /user/logout
 */
async function logoutUser(config: Partial<RequestConfig> = {}) {
  const res = await client<LogoutUserQueryResponse, Error, unknown>({
    method: 'GET',
    url: '/user/logout',
    baseURL: 'https://petstore3.swagger.io/api/v3',
    ...config,
  })
  return logoutUserQueryResponseSchema.parse(res.data)
}

export function logoutUserQueryOptions(config: Partial<RequestConfig> = {}) {
  return {
    fetcher: async () => {
      return logoutUser(config)
    },
  }
}

/**
 * @summary Logs out current logged in user session
 * @link /user/logout
 */
export function useLogoutUser(
  options: {
    query?: SWRConfiguration<LogoutUserQueryResponse, Error>
    client?: Partial<RequestConfig>
    shouldFetch?: boolean
  } = {},
) {
  const { query: queryOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const queryKey = logoutUserQueryKey()
  return useSWR<LogoutUserQueryResponse, Error, Key>(shouldFetch ? queryKey : null, {
    ...logoutUserQueryOptions(config),
    ...queryOptions,
  })
}
