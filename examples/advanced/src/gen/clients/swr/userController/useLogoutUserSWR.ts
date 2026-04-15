import useSWR from 'swr'
import type { Client, RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { LogoutUserQueryResponse, LogoutUserError } from '../../../models/ts/userController/LogoutUser.ts'
import { logoutUser } from '../../axios/userService/logoutUser.ts'

export const logoutUserSWRQueryKey = () => [{ url: '/user/logout' }] as const

export type LogoutUserSWRQueryKey = ReturnType<typeof logoutUserSWRQueryKey>

export function logoutUserSWRQueryOptions(config: Partial<RequestConfig> & { client?: Client } = {}) {
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
    query?: Parameters<typeof useSWR<ResponseConfig<LogoutUserQueryResponse>, ResponseErrorConfig<LogoutUserError>>>[2]
    client?: Partial<RequestConfig> & { client?: Client }
    shouldFetch?: boolean
    immutable?: boolean
  } = {},
) {
  const { query: queryOptions, client: config = {}, shouldFetch = true, immutable } = options ?? {}

  const queryKey = logoutUserSWRQueryKey()

  return useSWR<ResponseConfig<LogoutUserQueryResponse>, ResponseErrorConfig<LogoutUserError>, LogoutUserSWRQueryKey | null>(shouldFetch ? queryKey : null, {
    ...logoutUserSWRQueryOptions(config),
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
