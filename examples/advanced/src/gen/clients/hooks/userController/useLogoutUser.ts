import fetch from "../../../../axios-client.ts";
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from "../../../../axios-client.ts";
import type { QueryKey, QueryClient, QueryObserverOptions, UseQueryResult } from "../../../../tanstack-query-hook";
import type { LogoutUserQueryResponse } from "../../../models/ts/userController/LogoutUser.ts";
import { queryOptions, useQuery } from "../../../../tanstack-query-hook";
import { logoutUser } from "../../axios/userService/logoutUser.ts";

export const logoutUserQueryKey = () => [{ url: '/user/logout' }] as const

export type LogoutUserQueryKey = ReturnType<typeof logoutUserQueryKey>

export function logoutUserQueryOptions(config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
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
export function useLogoutUser<TData = ResponseConfig<LogoutUserQueryResponse>, TQueryData = ResponseConfig<LogoutUserQueryResponse>, TQueryKey extends QueryKey = LogoutUserQueryKey>(options: 
{
  query?: Partial<QueryObserverOptions<ResponseConfig<LogoutUserQueryResponse>, ResponseErrorConfig<Error>, TData, TQueryData, TQueryKey>> & { client?: QueryClient },
  client?: Partial<RequestConfig> & { client?: typeof fetch }
}
 = {}) {
  const { query: queryConfig = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...queryOptions } = queryConfig
  const queryKey = queryOptions?.queryKey ?? logoutUserQueryKey()

  const query = useQuery({
   ...logoutUserQueryOptions(config),
   queryKey,
   ...queryOptions
  } as unknown as QueryObserverOptions, queryClient) as UseQueryResult<TData, ResponseErrorConfig<Error>> & { queryKey: TQueryKey }

  query.queryKey = queryKey as TQueryKey

  return query
}