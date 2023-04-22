import useSWR from 'swr'

import client from '../../../../client'

import type { SWRConfiguration, SWRResponse } from 'swr'
import type { LogoutUserQueryResponse } from '../../../models/ts/userController/LogoutUser'

export function logoutUserQueryOptions<TData = LogoutUserQueryResponse, TError = unknown>(): SWRConfiguration<TData, TError> {
  return {
    fetcher: () => {
      return client<TData, TError>({
        method: 'get',
        url: `/user/logout`,
      })
    },
  }
}

/**
 * @summary Logs out current logged in user session
 * @link /user/logout
 */
export function useLogoutUser<TData = LogoutUserQueryResponse, TError = unknown>(options?: {
  query?: SWRConfiguration<TData, TError>
}): SWRResponse<TData, TError> {
  const { query: queryOptions } = options ?? {}

  const query = useSWR<TData, TError, string>(`/user/logout`, {
    ...logoutUserQueryOptions<TData, TError>(),
    ...queryOptions,
  })

  return query
}
