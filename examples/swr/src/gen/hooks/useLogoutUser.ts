import client from '@kubb/swagger-client/client'
import useSWR from 'swr'
import type { SWRConfiguration, SWRResponse } from 'swr'
import type { LogoutUserQueryResponse } from '../models/LogoutUser'

type LogoutUserClient = typeof client<LogoutUserQueryResponse, never, never>
type LogoutUser = {
  data: LogoutUserQueryResponse
  error: never
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
export function logoutUserQueryOptions<TData = LogoutUser['response']>(
  options: LogoutUser['client']['parameters'] = {},
): SWRConfiguration<TData, LogoutUser['error']> {
  return {
    fetcher: async () => {
      const res = await client<TData, LogoutUser['error']>({
        method: 'get',
        url: '/user/logout',
        ...options,
      })
      return res.data
    },
  }
}
/**
 * @summary Logs out current logged in user session
 * @link /user/logout
 */
export function useLogoutUser<TData = LogoutUser['response']>(options?: {
  query?: SWRConfiguration<TData, LogoutUser['error']>
  client?: LogoutUser['client']['parameters']
  shouldFetch?: boolean
}): SWRResponse<TData, LogoutUser['error']> {
  const { query: queryOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}
  const url = '/user/logout'
  const query = useSWR<TData, LogoutUser['error'], typeof url | null>(shouldFetch ? url : null, {
    ...logoutUserQueryOptions<TData>(clientOptions),
    ...queryOptions,
  })
  return query
}
