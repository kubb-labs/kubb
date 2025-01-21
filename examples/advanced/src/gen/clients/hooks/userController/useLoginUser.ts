import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../tanstack-query-client'
import type { QueryKey, QueryObserverOptions, UseQueryResult } from '../../../../tanstack-query-hook'
import type { LoginUserQueryResponse, LoginUserQueryParams, LoginUser400 } from '../../../models/ts/userController/LoginUser.ts'
import { queryOptions, useQuery } from '../../../../tanstack-query-hook'
import { loginUser } from '../../axios/userService/loginUser.ts'

export const loginUserQueryKey = (params?: LoginUserQueryParams) => [{ url: '/user/login' }, ...(params ? [params] : [])] as const

export type LoginUserQueryKey = ReturnType<typeof loginUserQueryKey>

export function loginUserQueryOptions({ params }: { params?: LoginUserQueryParams }, config: Partial<RequestConfig> = {}) {
  const queryKey = loginUserQueryKey(params)
  return queryOptions<ResponseConfig<LoginUserQueryResponse>, ResponseErrorConfig<LoginUser400>, ResponseConfig<LoginUserQueryResponse>, typeof queryKey>({
    queryKey,
    queryFn: async ({ signal }) => {
      config.signal = signal
      return loginUser({ params }, config)
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
  { params }: { params?: LoginUserQueryParams },
  options: {
    query?: Partial<QueryObserverOptions<ResponseConfig<LoginUserQueryResponse>, ResponseErrorConfig<LoginUser400>, TData, TQueryData, TQueryKey>>
    client?: Partial<RequestConfig>
  } = {},
) {
  const { query: queryOptions, client: config = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? loginUserQueryKey(params)

  const query = useQuery({
    ...(loginUserQueryOptions({ params }, config) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, 'queryKey'>),
  }) as UseQueryResult<TData, ResponseErrorConfig<LoginUser400>> & { queryKey: TQueryKey }

  query.queryKey = queryKey as TQueryKey

  return query
}
