import client from '@kubb/plugin-client/client'
import type { LoginUserQueryResponse, LoginUserQueryParams, LoginUser400 } from '../models/LoginUser'
import type { RequestConfig } from '@kubb/plugin-client/client'
import type { QueryKey, QueryObserverOptions, UseQueryReturnType } from '@tanstack/vue-query'
import type { MaybeRef } from 'vue'
import { useQuery, queryOptions } from '@tanstack/vue-query'
import { unref } from 'vue'

export const loginUserQueryKey = (params?: MaybeRef<LoginUserQueryParams>) => [{ url: '/user/login' }, ...(params ? [params] : [])] as const

export type LoginUserQueryKey = ReturnType<typeof loginUserQueryKey>

/**
 * @summary Logs user into the system
 * @link /user/login
 */
async function loginUser(params?: LoginUserQueryParams, config: Partial<RequestConfig> = {}) {
  const res = await client<LoginUserQueryResponse, LoginUser400, unknown>({
    method: 'GET',
    url: '/user/login',
    baseURL: 'https://petstore3.swagger.io/api/v3',
    params,
    ...config,
  })
  return res.data
}

export function loginUserQueryOptions(params?: MaybeRef<LoginUserQueryParams>, config: Partial<RequestConfig> = {}) {
  const queryKey = loginUserQueryKey(params)
  return queryOptions({
    queryKey,
    queryFn: async ({ signal }) => {
      config.signal = signal
      return loginUser(unref(params), unref(config))
    },
  })
}

/**
 * @summary Logs user into the system
 * @link /user/login
 */
export function useLoginUser<TData = LoginUserQueryResponse, TQueryData = LoginUserQueryResponse, TQueryKey extends QueryKey = LoginUserQueryKey>(
  params?: MaybeRef<LoginUserQueryParams>,
  options: {
    query?: Partial<QueryObserverOptions<LoginUserQueryResponse, LoginUser400, TData, TQueryData, TQueryKey>>
    client?: Partial<RequestConfig>
  } = {},
) {
  const { query: queryOptions, client: config = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? loginUserQueryKey(params)
  const query = useQuery({
    ...(loginUserQueryOptions(params, config) as unknown as QueryObserverOptions),
    queryKey: queryKey as QueryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, 'queryKey'>),
  }) as UseQueryReturnType<TData, LoginUser400> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
