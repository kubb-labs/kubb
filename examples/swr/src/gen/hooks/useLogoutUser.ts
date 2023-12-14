import useSWR from 'swr'
import client from '@kubb/swagger-client/client'
import type { SWRConfiguration, SWRResponse } from 'swr'
import type { LogoutUserQueryResponse, LogoutUserError } from '../models/LogoutUser'

type LogoutUserClient = typeof client<LogoutUserQueryResponse, LogoutUserError, never>
type LogoutUser = {
  data: LogoutUserQueryResponse
  error: LogoutUserError
  request: never
  pathParams: never
  queryParams: never
  headerParams: never
  response: LogoutUserQueryResponse
  client: {
    parameters: Partial<Parameters<LogoutUserClient>[0]>
    return: Awaited<ReturnType<LogoutUserClient>>
  }
}
export function logoutUserQueryOptions<TData extends LogoutUser['response'] = LogoutUser['response'], TError = LogoutUser['error']>(
  options: LogoutUser['client']['parameters'] = {},
): SWRConfiguration<TData, TError> {
  return {
    fetcher: async () => {
      const res = await client<TData, TError>({
        method: 'get',
        url: `/user/logout`,
        ...options,
      })
      return res.data
    },
  }
}
/**
 * @summary Logs out current logged in user session
 * @link /user/logout */
export function useLogoutUser<TData extends LogoutUser['response'] = LogoutUser['response'], TError = LogoutUser['error']>(options?: {
  query?: SWRConfiguration<TData, TError>
  client?: LogoutUser['client']['parameters']
  shouldFetch?: boolean
}): SWRResponse<TData, TError> {
  const { query: queryOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}
  const url = `/user/logout` as const
  const query = useSWR<TData, TError, typeof url | null>(shouldFetch ? url : null, {
    ...logoutUserQueryOptions<TData, TError>(clientOptions),
    ...queryOptions,
  })
  return query
}
