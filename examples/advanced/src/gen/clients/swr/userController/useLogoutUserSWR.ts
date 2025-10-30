import useSWR from 'swr'
import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { LogoutUserQueryResponse } from '../../../models/ts/userController/LogoutUser.ts'
import { logoutUser } from '../../axios/userService/logoutUser.ts'

export const logoutUserQueryKeySWR = () => [{ url: '/user/logout' }] as const

export type LogoutUserQueryKeySWR = ReturnType<typeof logoutUserQueryKeySWR>

export function logoutUserQueryOptionsSWR(config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
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
    query?: Parameters<typeof useSWR<ResponseConfig<LogoutUserQueryResponse>, ResponseErrorConfig<Error>>>[2]
    client?: Partial<RequestConfig> & { client?: typeof fetch }
    shouldFetch?: boolean
    immutable?: boolean
  } = {},
) {
  const { query: queryOptions, client: config = {}, shouldFetch = true, immutable } = options ?? {}

  const queryKey = logoutUserQueryKeySWR()

  return useSWR<ResponseConfig<LogoutUserQueryResponse>, ResponseErrorConfig<Error>, LogoutUserQueryKeySWR | null>(shouldFetch ? queryKey : null, {
    ...logoutUserQueryOptionsSWR(config),
    ...(immutable
      ? {
          revalidateIfStale: false,
          revalidateOnFocus: false,
          revalidateOnReconnect: false,
        }
      : {}),
    ...queryOptions,
  })
}
