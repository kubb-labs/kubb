import type client from '../../../../axios-client.ts'
import useSWR from 'swr'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { LogoutUserQueryResponse } from '../../../models/ts/userController/LogoutUser.ts'
import { logoutUser } from '../../axios/userService/logoutUser.ts'

export const logoutUserQueryKeySWR = () => [{ url: '/user/logout' }] as const

export type LogoutUserQueryKeySWR = ReturnType<typeof logoutUserQueryKeySWR>

export function logoutUserQueryOptionsSWR(config: Partial<RequestConfig> & { client?: typeof client } = {}) {
  return {
    fetcher: async () => {
      return logoutUser(config)
    },
  }
}

/**
 * @summary Logs out current logged in user session
 * {@link /user/logout}
 */
export function useLogoutUserSWR(
  options: {
    query?: Parameters<typeof useSWR<ResponseConfig<LogoutUserQueryResponse>, ResponseErrorConfig<Error>, LogoutUserQueryKeySWR | null, any>>[2]
    client?: Partial<RequestConfig> & { client?: typeof client }
    shouldFetch?: boolean
  } = {},
) {
  const { query: queryOptions, client: config = {}, shouldFetch = true } = options ?? {}

  const queryKey = logoutUserQueryKeySWR()

  return useSWR<ResponseConfig<LogoutUserQueryResponse>, ResponseErrorConfig<Error>, LogoutUserQueryKeySWR | null>(shouldFetch ? queryKey : null, {
    ...logoutUserQueryOptionsSWR(config),
    ...queryOptions,
  })
}
