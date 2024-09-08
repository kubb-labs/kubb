import client from '@kubb/plugin-client/client'
import type { LoginUserQueryResponse, LoginUserQueryParams, LoginUser400 } from '../models/LoginUser.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'
import type { QueryKey, QueryObserverOptions, UseQueryResult } from '@tanstack/react-query'
import { useQuery, queryOptions } from '@tanstack/react-query'

export const loginUserQueryKey = (params?: LoginUserQueryParams) => ['v5', { url: '/user/login' }, ...(params ? [params] : [])] as const

export type LoginUserQueryKey = ReturnType<typeof loginUserQueryKey>

/**
 * @summary Logs user into the system
 * @link /user/login
 */
async function loginUser(params?: LoginUserQueryParams, config: Partial<RequestConfig> = {}) {
  const res = await client<LoginUserQueryResponse, LoginUser400, unknown>({
    method: 'get',
    url: '/user/login',
    baseURL: 'https://petstore3.swagger.io/api/v3',
    params,
    ...config,
  })
  return res.data
}

export function loginUserQueryOptions(params?: LoginUserQueryParams, config: Partial<RequestConfig> = {}) {
  const queryKey = loginUserQueryKey(params)
  return queryOptions({
    queryKey,
    queryFn: async () => {
      return loginUser(params, config)
    },
  })
}

/**
 * @summary Logs user into the system
 * @link /user/login
 */
export function useLoginUserHook<TData = LoginUserQueryResponse, TQueryData = LoginUserQueryResponse, TQueryKey extends QueryKey = LoginUserQueryKey>(
  params?: LoginUserQueryParams,
  options: {
    query?: Partial<QueryObserverOptions<LoginUserQueryResponse, LoginUser400, TData, TQueryData, TQueryKey>>
    client?: Partial<RequestConfig>
  } = {},
) {
  const { query: queryOptions, client: config = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? loginUserQueryKey(params)
  const query = useQuery({
    ...(loginUserQueryOptions(params, config) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, 'queryKey'>),
  }) as UseQueryResult<TData, LoginUser400> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
