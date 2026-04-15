import type { Client, RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { QueryKey, QueryClient, QueryObserverOptions, UseQueryResult } from '../../../../tanstack-query-hook'
import type { LoginUserQueryResponse, LoginUserQueryParams, LoginUser400 } from '../../../models/ts/userController/LoginUser.ts'
import { queryOptions, useQuery } from '../../../../tanstack-query-hook'
import { loginUser } from '../../axios/userService/loginUser.ts'

export const loginUserQueryKey = (params?: LoginUserQueryParams) => [{ url: '/user/login' }, ...(params ? [params] : [])] as const

export type LoginUserQueryKey = ReturnType<typeof loginUserQueryKey>

export function loginUserQueryOptions({ params }: { params?: LoginUserQueryParams } = {}, config: Partial<RequestConfig> & { client?: Client } = {}) {
  const queryKey = loginUserQueryKey(params)
  return queryOptions<ResponseConfig<LoginUserQueryResponse>, ResponseErrorConfig<LoginUser400>, ResponseConfig<LoginUserQueryResponse>, typeof queryKey>({
    queryKey,
    queryFn: async ({ signal }) => {
      return loginUser({ params: params }, { ...config, signal: config.signal ?? signal })
    },
  })
}

/**
 * @summary Logs user into the system
 * {@link /user/login}
 */
export function useLoginUser<
  TData = ResponseConfig<LoginUserQueryResponse>,
  TQueryData = ResponseConfig<LoginUserQueryResponse>,
  TQueryKey extends QueryKey = LoginUserQueryKey,
>(
  { params }: { params?: LoginUserQueryParams } = {},
  options: {
    query?: Partial<QueryObserverOptions<ResponseConfig<LoginUserQueryResponse>, ResponseErrorConfig<LoginUser400>, TData, TQueryData, TQueryKey>> & {
      client?: QueryClient
    }
    client?: Partial<RequestConfig> & { client?: Client }
  } = {},
) {
  const { query: queryConfig = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...resolvedOptions } = queryConfig
  const queryKey = resolvedOptions?.queryKey ?? loginUserQueryKey(params)

  const query = useQuery(
    {
      ...loginUserQueryOptions({ params }, config),
      ...resolvedOptions,
      queryKey,
    } as unknown as QueryObserverOptions,
    queryClient,
  ) as UseQueryResult<TData, ResponseErrorConfig<LoginUser400>> & { queryKey: TQueryKey }

  query.queryKey = queryKey as TQueryKey

  return query
}
