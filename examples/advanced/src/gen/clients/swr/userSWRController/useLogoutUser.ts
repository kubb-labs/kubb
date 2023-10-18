import useSWR from 'swr'
import type { SWRConfiguration, SWRResponse } from 'swr'
import client from '../../../../swr-client.ts'
import type { ResponseConfig } from '../../../../swr-client.ts'
import type { LogoutUserQueryResponse } from '../../../models/ts/userController/LogoutUser'

export function logoutUserQueryOptions<TData = LogoutUserQueryResponse, TError = unknown>(
  options: Partial<Parameters<typeof client>[0]> = {},
): SWRConfiguration<ResponseConfig<TData>, TError> {
  return {
    fetcher: () => {
      return client<TData, TError>({
        method: 'get',
        url: `/user/logout`,

        ...options,
      }).then((res) => res)
    },
  }
}

/**
 * @summary Logs out current logged in user session
 * @link /user/logout
 */

export function useLogoutUser<TData = LogoutUserQueryResponse, TError = unknown>(options?: {
  query?: SWRConfiguration<ResponseConfig<TData>, TError>
  client?: Partial<Parameters<typeof client<TData, TError>>[0]>
  shouldFetch?: boolean
}): SWRResponse<ResponseConfig<TData>, TError> {
  const { query: queryOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}

  const url = shouldFetch ? `/user/logout` : null
  const query = useSWR<ResponseConfig<TData>, TError, string | null>(url, {
    ...logoutUserQueryOptions<TData, TError>(clientOptions),
    ...queryOptions,
  })

  return query
}
