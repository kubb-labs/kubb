import client from '../../../../swr-client.ts'
import useSWR from 'swr'
import type { RequestConfig } from '../../../../swr-client.ts'
import type { LogoutUserQueryResponse } from '../../../models/ts/userController/LogoutUser.ts'
import type { SWRConfiguration, SWRResponse } from 'swr'
import { logoutUserQueryResponseSchema } from '../../../zod/userController/logoutUserSchema.ts'

type LogoutUserClient = typeof client<LogoutUserQueryResponse, never, never>

type LogoutUser = {
  data: LogoutUserQueryResponse
  error: never
  request: never
  pathParams: never
  queryParams: never
  headerParams: never
  response: Awaited<ReturnType<LogoutUserClient>>
  client: {
    parameters: Partial<Parameters<LogoutUserClient>[0]>
    return: Awaited<ReturnType<LogoutUserClient>>
  }
}

export function logoutUserQueryOptions<TData = LogoutUser['response']>(config: Partial<RequestConfig> = {}): SWRConfiguration<TData, LogoutUser['error']> {
  return {
    fetcher: async () => {
      const res = await client<LogoutUserQueryResponse>({ method: 'get', url: '/user/logout', baseURL: 'https://petstore3.swagger.io/api/v3', ...config })
      return logoutUserQueryResponseSchema.parse(res)
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
