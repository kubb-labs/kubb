import client from '../../../../tanstack-query-client.ts'
import type { RequestConfig, ResponseConfig } from '../../../../tanstack-query-client.ts'
import type { QueryKey, QueryObserverOptions, UseQueryResult } from '../../../../tanstack-query-hook.ts'
import type { LoginUserQueryResponse, LoginUserQueryParams, LoginUser400 } from '../../../models/ts/userController/LoginUser.ts'
import { useQuery, queryOptions } from '../../../../tanstack-query-hook.ts'
import { loginUserQueryResponseSchema } from '../../../zod/userController/loginUserSchema.ts'

export const loginUserQueryKey = (params?: LoginUserQueryParams) => [{ url: '/user/login' }, ...(params ? [params] : [])] as const

export type LoginUserQueryKey = ReturnType<typeof loginUserQueryKey>

/**
 * @summary Logs user into the system
 * @link /user/login
 */
async function loginUser(
  {
    params,
  }: {
    params?: LoginUserQueryParams
  },
  config: Partial<RequestConfig> = {},
) {
  const res = await client<LoginUserQueryResponse, LoginUser400, unknown>({ method: 'GET', url: '/user/login', params, ...config })
  return { ...res, data: loginUserQueryResponseSchema.parse(res.data) }
}

export function loginUserQueryOptions(
  {
    params,
  }: {
    params?: LoginUserQueryParams
  },
  config: Partial<RequestConfig> = {},
) {
  const queryKey = loginUserQueryKey(params)
  return queryOptions({
    queryKey,
    queryFn: async ({ signal }) => {
      config.signal = signal
      return loginUser({ params }, config)
    },
  })
}

/**
 * @summary Logs user into the system
 * @link /user/login
 */
export function useLoginUser<
  TData = ResponseConfig<LoginUserQueryResponse>,
  TQueryData = ResponseConfig<LoginUserQueryResponse>,
  TQueryKey extends QueryKey = LoginUserQueryKey,
>(
  {
    params,
  }: {
    params?: LoginUserQueryParams
  },
  options: {
    query?: Partial<QueryObserverOptions<ResponseConfig<LoginUserQueryResponse>, LoginUser400, TData, TQueryData, TQueryKey>>
    client?: Partial<RequestConfig>
  } = {},
) {
  const { query: queryOptions, client: config = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? loginUserQueryKey(params)
  const query = useQuery({
    ...(loginUserQueryOptions({ params }, config) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, 'queryKey'>),
  }) as UseQueryResult<TData, LoginUser400> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
