import client from '@kubb/plugin-client/client'
import type { LoginUserQueryResponse, LoginUserQueryParams, LoginUser400 } from '../models/LoginUser.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'
import type { QueryKey, UseSuspenseQueryOptions, UseSuspenseQueryResult } from '@tanstack/react-query'
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query'

export const loginUserSuspenseQueryKey = (params?: LoginUserQueryParams) => ['v5', { url: '/user/login' }, ...(params ? [params] : [])] as const

export type LoginUserSuspenseQueryKey = ReturnType<typeof loginUserSuspenseQueryKey>

/**
 * @summary Logs user into the system
 * @link /user/login
 */
async function loginUser(params?: LoginUserQueryParams, config: Partial<RequestConfig> = {}) {
  const res = await client<LoginUserQueryResponse, LoginUser400, unknown>({ method: 'GET', url: '/user/login', params, ...config })
  return res.data
}

export function loginUserSuspenseQueryOptionsHook(params?: LoginUserQueryParams, config: Partial<RequestConfig> = {}) {
  const queryKey = loginUserSuspenseQueryKey(params)
  return queryOptions({
    queryKey,
    queryFn: async ({ signal }) => {
      config.signal = signal
      return loginUser(params, config)
    },
  })
}

/**
 * @summary Logs user into the system
 * @link /user/login
 */
export function useLoginUserSuspenseHook<
  TData = LoginUserQueryResponse,
  TQueryData = LoginUserQueryResponse,
  TQueryKey extends QueryKey = LoginUserSuspenseQueryKey,
>(
  params?: LoginUserQueryParams,
  options: {
    query?: Partial<UseSuspenseQueryOptions<LoginUserQueryResponse, LoginUser400, TData, TQueryKey>>
    client?: Partial<RequestConfig>
  } = {},
) {
  const { query: queryOptions, client: config = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? loginUserSuspenseQueryKey(params)
  const query = useSuspenseQuery({
    ...(loginUserSuspenseQueryOptionsHook(params, config) as unknown as UseSuspenseQueryOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<UseSuspenseQueryOptions, 'queryKey'>),
  }) as UseSuspenseQueryResult<TData, LoginUser400> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
