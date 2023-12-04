import useSWR from 'swr'
import client from '../../../../swr-client.ts'
import type { SWRConfiguration, SWRResponse } from 'swr'
import type { ResponseConfig } from '../../../../swr-client.ts'
import type { LogoutUserQueryResponse, LogoutUserError } from '../../../models/ts/userController/LogoutUser'

export function logoutUserQueryOptions<TData = LogoutUserQueryResponse, TError = LogoutUserError>(
  options: Partial<Parameters<typeof client>[0]> = {},
): SWRConfiguration<ResponseConfig<TData>, TError> {
  return {
    fetcher: () => {
      return client<TData, TError>({
        method: 'get',
        url: `/user/logout`,
        ...options,
      }).then(res => res)
    },
  }
}
/**
 * @summary Logs out current logged in user session
 * @link /user/logout */
export function useLogoutUser<TData = LogoutUserQueryResponse, TError = LogoutUserError>(options?: {
  query?: SWRConfiguration<ResponseConfig<TData>, TError>
  client?: Partial<Parameters<typeof client<TData, TError>>[0]>
  shouldFetch?: boolean
}): SWRResponse<ResponseConfig<TData>, TError> {
  const { query: queryOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}
  const url = `/user/logout` as const
  const query = useSWR<ResponseConfig<TData>, TError, typeof url | null>(shouldFetch ? url : null, {
    ...logoutUserQueryOptions<TData, TError>(clientOptions),
    ...queryOptions,
  })
  return query
}
