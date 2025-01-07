import client from '../../../../swr-client.ts'
import useSWR from 'swr'
import type { RequestConfig, ResponseErrorConfig } from '../../../../swr-client.ts'
import type { LogoutUserQueryResponse } from '../../../models/ts/userController/LogoutUser.ts'
import { logoutUserQueryResponseSchema } from '../../../zod/userController/logoutUserSchema.ts'

export const logoutUserQueryKeySWR = () => [{ url: '/user/logout' }] as const

export type LogoutUserQueryKeySWR = ReturnType<typeof logoutUserQueryKeySWR>

/**
 * @summary Logs out current logged in user session
 * {@link /user/logout}
 */
async function logoutUserSWR(config: Partial<RequestConfig> = {}) {
  const res = await client<LogoutUserQueryResponse, ResponseErrorConfig<Error>, unknown>({
    method: 'GET',
    url: '/user/logout',
    baseURL: 'https://petstore3.swagger.io/api/v3',
    ...config,
  })
  return logoutUserQueryResponseSchema.parse(res.data)
}

export function logoutUserQueryOptionsSWR(config: Partial<RequestConfig> = {}) {
  return {
    fetcher: async () => {
      return logoutUserSWR(config)
    },
  }
}

/**
 * @summary Logs out current logged in user session
 * {@link /user/logout}
 */
export function useLogoutUserSWR(
  options: {
    query?: Parameters<typeof useSWR<LogoutUserQueryResponse, ResponseErrorConfig<Error>, LogoutUserQueryKeySWR | null, any>>[2]
    client?: Partial<RequestConfig>
    shouldFetch?: boolean
  } = {},
) {
  const { query: queryOptions, client: config = {}, shouldFetch = true } = options ?? {}

  const queryKey = logoutUserQueryKeySWR()

  return useSWR<LogoutUserQueryResponse, ResponseErrorConfig<Error>, LogoutUserQueryKeySWR | null>(shouldFetch ? queryKey : null, {
    ...logoutUserQueryOptionsSWR(config),
    ...queryOptions,
  })
}
