import client from '../../../../tanstack-query-client'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../tanstack-query-client'
import type { QueryKey, QueryObserverOptions, UseQueryResult } from '../../../../tanstack-query-hook'
import type { LogoutUserQueryResponse } from '../../../models/ts/userController/LogoutUser.ts'
import { queryOptions, useQuery } from '../../../../tanstack-query-hook'
import { logoutUserQueryResponseSchema } from '../../../zod/userController/logoutUserSchema.ts'

export const logoutUserQueryKey = () => [{ url: '/user/logout' }] as const

export type LogoutUserQueryKey = ReturnType<typeof logoutUserQueryKey>

/**
 * @summary Logs out current logged in user session
 * {@link /user/logout}
 */
async function logoutUser(config: Partial<RequestConfig> = {}) {
  const res = await client<LogoutUserQueryResponse, ResponseErrorConfig<Error>, unknown>({ method: 'GET', url: '/user/logout', ...config })
  return { ...res, data: logoutUserQueryResponseSchema.parse(res.data) }
}

export function logoutUserQueryOptions(config: Partial<RequestConfig> = {}) {
  const queryKey = logoutUserQueryKey()
  return queryOptions<ResponseConfig<LogoutUserQueryResponse>, ResponseErrorConfig<Error>, ResponseConfig<LogoutUserQueryResponse>, typeof queryKey>({
    queryKey,
    queryFn: async ({ signal }) => {
      config.signal = signal
      return logoutUser(config)
    },
  })
}

/**
 * @summary Logs out current logged in user session
 * {@link /user/logout}
 */
export function useLogoutUser<
  TData = ResponseConfig<LogoutUserQueryResponse>,
  TQueryData = ResponseConfig<LogoutUserQueryResponse>,
  TQueryKey extends QueryKey = LogoutUserQueryKey,
>(
  options: {
    query?: Partial<QueryObserverOptions<ResponseConfig<LogoutUserQueryResponse>, ResponseErrorConfig<Error>, TData, TQueryData, TQueryKey>>
    client?: Partial<RequestConfig>
  } = {},
) {
  const { query: queryOptions, client: config = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? logoutUserQueryKey()

  const query = useQuery({
    ...(logoutUserQueryOptions(config) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, 'queryKey'>),
  }) as UseQueryResult<TData, ResponseErrorConfig<Error>> & { queryKey: TQueryKey }

  query.queryKey = queryKey as TQueryKey

  return query
}
