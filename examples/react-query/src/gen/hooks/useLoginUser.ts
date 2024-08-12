import client from '@kubb/plugin-client/client'
import { useQuery, queryOptions } from '@tanstack/react-query'
import type { LoginUserQueryResponse, LoginUserQueryParams, LoginUser400 } from '../models/LoginUser'
import type { QueryKey, QueryObserverOptions, UseQueryResult } from '@tanstack/react-query'

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
export function useLoginUserQueryOptions(params?: LoginUser['queryParams'], options: LoginUser['client']['parameters'] = {}) {
  const queryKey = useLoginUserQueryKey(params)
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<LoginUser['data'], LoginUser['error']>({
        method: 'get',
        url: '/user/login',
        ...options,
      })
      return res.data
    },
  })
}
export const useLoginUserQueryKey = (params?: LoginUser['queryParams']) => ['v5', { url: '/user/login' }, ...(params ? [params] : [])] as const
export type LoginUserQueryKey = ReturnType<typeof useLoginUserQueryKey>
/**
 * @summary Logs user into the system
 * @link /user/login
 */
export function useLoginUser<TData = LoginUser['response'], TQueryData = LoginUser['response'], TQueryKey extends QueryKey = LoginUserQueryKey>(
  params?: LoginUser['queryParams'],
  options: {
    query?: Partial<QueryObserverOptions<LoginUser['response'], LoginUser['error'], TData, TQueryData, TQueryKey>>
    client?: LoginUser['client']['parameters']
  } = {},
): UseQueryResult<TData, LoginUser['error']> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? useLoginUserQueryKey(params)
  const query = useQuery({
    ...(useLoginUserQueryOptions(params, clientOptions) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, 'queryKey'>),
  }) as UseQueryResult<TData, LoginUser['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
