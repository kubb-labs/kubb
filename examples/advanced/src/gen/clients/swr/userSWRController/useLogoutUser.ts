import useSWR from 'swr'
import type { SWRConfiguration, SWRResponse } from 'swr'
import client from '../../../../client'
import type { LogoutUserQueryResponse } from '../../../models/ts/userController/LogoutUser'

export function logoutUserQueryOptions<TData = LogoutUserQueryResponse, TError = unknown>(
  options: Partial<Parameters<typeof client>[0]> = {},
): SWRConfiguration<TData, TError> {
  return {
    fetcher: () => {
      return client<TData, TError>({
        method: 'get',
        url: `/user/logout`,

        ...options,
      }).then((res) => res.data)
    },
  }
}

/**
 * @summary Logs out current logged in user session
 * @link /user/logout
 */

export function useLogoutUser<TData = LogoutUserQueryResponse, TError = unknown>(options?: {
  query?: SWRConfiguration<TData, TError>
  client?: Partial<Parameters<typeof client<TData, TError>>[0]>
}): SWRResponse<TData, TError> {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}

  const query = useSWR<TData, TError, string>(`/user/logout`, {
    ...logoutUserQueryOptions<TData, TError>(clientOptions),
    ...queryOptions,
  })

  return query
}
