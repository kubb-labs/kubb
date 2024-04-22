import client from '@kubb/swagger-client/client'
import { useQuery, queryOptions, useSuspenseQuery } from '@tanstack/react-query'
import type { LoginUserQueryResponse, LoginUserQueryParams, LoginUser400 } from '../models/LoginUser'
import type { QueryObserverOptions, UseQueryResult, QueryKey, UseSuspenseQueryOptions, UseSuspenseQueryResult } from '@tanstack/react-query'

type LoginUserClient = typeof client<LoginUserQueryResponse, LoginUser400, never>
type LoginUser = {
  data: LoginUserQueryResponse
  error: LoginUser400
  request: never
  pathParams: never
  queryParams: LoginUserQueryParams
  headerParams: never
  response: LoginUserQueryResponse
  client: {
    parameters: Partial<Parameters<LoginUserClient>[0]>
    return: Awaited<ReturnType<LoginUserClient>>
  }
}
export const loginUserQueryKey = (params?: LoginUser['queryParams']) => ['v5', { url: '/user/login' }, ...(params ? [params] : [])] as const
export type LoginUserQueryKey = ReturnType<typeof loginUserQueryKey>
export function loginUserQueryOptions(params?: LoginUser['queryParams'], options: LoginUser['client']['parameters'] = {}) {
  const queryKey = loginUserQueryKey(params)
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<LoginUser['data'], LoginUser['error']>({
        method: 'get',
        url: `/user/login`,
        params,
        ...options,
      })
      return res.data
    },
  })
}
/**
 * @summary Logs user into the system
 * @link /user/login
 */
export function useLoginUserHook<TData = LoginUser['response'], TQueryData = LoginUser['response'], TQueryKey extends QueryKey = LoginUserQueryKey>(
  params?: LoginUser['queryParams'],
  options: {
    query?: Partial<QueryObserverOptions<LoginUser['response'], LoginUser['error'], TData, TQueryData, TQueryKey>>
    client?: LoginUser['client']['parameters']
  } = {},
): UseQueryResult<TData, LoginUser['error']> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? loginUserQueryKey(params)
  const query = useQuery({
    ...(loginUserQueryOptions(params, clientOptions) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, 'queryKey'>),
  }) as UseQueryResult<TData, LoginUser['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
export const loginUserSuspenseQueryKey = (params?: LoginUser['queryParams']) => ['v5', { url: '/user/login' }, ...(params ? [params] : [])] as const
export type LoginUserSuspenseQueryKey = ReturnType<typeof loginUserSuspenseQueryKey>
export function loginUserSuspenseQueryOptions(params?: LoginUser['queryParams'], options: LoginUser['client']['parameters'] = {}) {
  const queryKey = loginUserSuspenseQueryKey(params)
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<LoginUser['data'], LoginUser['error']>({
        method: 'get',
        url: `/user/login`,
        params,
        ...options,
      })
      return res.data
    },
  })
}
/**
 * @summary Logs user into the system
 * @link /user/login
 */
export function useLoginUserHookSuspense<TData = LoginUser['response'], TQueryKey extends QueryKey = LoginUserSuspenseQueryKey>(
  params?: LoginUser['queryParams'],
  options: {
    query?: Partial<UseSuspenseQueryOptions<LoginUser['response'], LoginUser['error'], TData, TQueryKey>>
    client?: LoginUser['client']['parameters']
  } = {},
): UseSuspenseQueryResult<TData, LoginUser['error']> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? loginUserSuspenseQueryKey(params)
  const query = useSuspenseQuery({
    ...(loginUserSuspenseQueryOptions(params, clientOptions) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, 'queryKey'>),
  }) as UseSuspenseQueryResult<TData, LoginUser['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
