import useSWR from 'swr'
import client from '@kubb/swagger-client/client'
import type { SWRConfiguration, SWRResponse } from 'swr'
import type { LogoutUserQueryResponse, LogoutUserError } from '../models/LogoutUser'

export function logoutUserQueryOptions<TData = LogoutUserQueryResponse, TError = LogoutUserError>(
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
} /**
 * @summary Logs out current logged in user session
 * @link /user/logout
 */
export function useLogoutUser<TData = LogoutUserQueryResponse, TError = LogoutUserError>(options?: {
  query?: SWRConfiguration<TData, TError>
  client?: Partial<Parameters<typeof client<TData, TError>>[0]>
  shouldFetch?: boolean
}): SWRResponse<TData, TError> {
  const { query: queryOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}
  const url = shouldFetch ? `/user/logout` : null
  const query = useSWR<TData, TError, string | null>(url, {
    ...logoutUserQueryOptions<TData, TError>(clientOptions),
    ...queryOptions,
  })
  return query
}
