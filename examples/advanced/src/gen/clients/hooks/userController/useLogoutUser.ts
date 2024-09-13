import client from '../../../../tanstack-query-client.ts'
import type { RequestConfig } from '../../../../tanstack-query-client.ts'
import type { QueryKey, QueryObserverOptions, UseQueryResult } from '../../../../tanstack-query-hook.ts'
import type { LogoutUserQueryResponse } from '../../../models/ts/userController/LogoutUser.ts'
import { useQuery, queryOptions } from '../../../../tanstack-query-hook.ts'
import { logoutUserQueryResponseSchema } from '../../../zod/userController/logoutUserSchema.ts'

export const logoutUserQueryKey = () => [{ url: '/user/logout' }] as const

export type LogoutUserQueryKey = ReturnType<typeof logoutUserQueryKey>

/**
 * @summary Logs out current logged in user session
 * @link /user/logout
 */
async function logoutUser(config: Partial<RequestConfig> = {}) {
  const res = await client<LogoutUserQueryResponse, unknown, unknown>({
    method: 'GET',
    url: '/user/logout',
    baseURL: 'https://petstore3.swagger.io/api/v3',
    ...config,
  })
  return logoutUserQueryResponseSchema.parse(res.data)
}

export function logoutUserQueryOptions(config: Partial<RequestConfig> = {}) {
  const queryKey = logoutUserQueryKey()
  return queryOptions({
    queryKey,
    queryFn: async () => {
      return logoutUser(config)
    },
  })
}

/**
 * @summary Logs out current logged in user session
 * @link /user/logout
 */
export function useLogoutUser<TData = LogoutUserQueryResponse, TQueryData = LogoutUserQueryResponse, TQueryKey extends QueryKey = LogoutUserQueryKey>(
  options: {
    query?: Partial<QueryObserverOptions<LogoutUserQueryResponse, unknown, TData, TQueryData, TQueryKey>>
    client?: Partial<RequestConfig>
  } = {},
) {
  const { query: queryOptions, client: config = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? logoutUserQueryKey()
  const query = useQuery({
    ...(logoutUserQueryOptions(config) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, 'queryKey'>),
  }) as UseQueryResult<TData, unknown> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
