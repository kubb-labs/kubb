import client from '../../../../tanstack-query-client.ts'
import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import type { KubbQueryFactory } from './types'
import type { LoginUserQueryResponse, LoginUserQueryParams, LoginUser400 } from '../../../models/ts/userController/LoginUser'
import type { UseBaseQueryOptions, UseQueryResult, QueryKey, UseInfiniteQueryOptions, UseInfiniteQueryResult } from '@tanstack/react-query'

type LoginUser = KubbQueryFactory<LoginUserQueryResponse, LoginUser400, never, never, LoginUserQueryParams, never, LoginUserQueryResponse, {
  dataReturnType: 'full'
  type: 'query'
}>
export const loginUserQueryKey = (params?: LoginUser['queryParams']) => [{ url: `/user/login` }, ...(params ? [params] : [])] as const
export type LoginUserQueryKey = ReturnType<typeof loginUserQueryKey>
export function loginUserQueryOptions<
  TQueryFnData extends LoginUser['data'] = LoginUser['data'],
  TError = LoginUser['error'],
  TData = LoginUser['response'],
  TQueryData = LoginUser['response'],
>(
  params?: LoginUser['queryParams'],
  options: LoginUser['client']['paramaters'] = {},
): UseBaseQueryOptions<LoginUser['unionResponse'], TError, TData, TQueryData, LoginUserQueryKey> {
  const queryKey = loginUserQueryKey(params)
  return {
    queryKey,
    queryFn: () => {
      return client<TQueryFnData, TError>({
        method: 'get',
        url: `/user/login`,
        params,
        ...options,
      }).then(res => res?.data || res)
    },
  }
} /**
 * @summary Logs user into the system
 * @link /user/login
 */

export function useLoginUser<
  TQueryFnData extends LoginUser['data'] = LoginUser['data'],
  TError = LoginUser['error'],
  TData = LoginUser['response'],
  TQueryData = LoginUser['response'],
  TQueryKey extends QueryKey = LoginUserQueryKey,
>(params?: LoginUser['queryParams'], options: {
  query?: UseBaseQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
  client?: LoginUser['client']['paramaters']
} = {}): UseQueryResult<TData, TError> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? loginUserQueryKey(params)
  const query = useQuery<TQueryFnData, TError, TData, any>({
    ...loginUserQueryOptions<TQueryFnData, TError, TData, TQueryData>(params, clientOptions),
    queryKey,
    ...queryOptions,
  }) as UseQueryResult<TData, TError> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}

type LoginUserInfinite = KubbQueryFactory<LoginUserQueryResponse, LoginUser400, never, never, LoginUserQueryParams, never, LoginUserQueryResponse, {
  dataReturnType: 'full'
  type: 'query'
}>
export const loginUserInfiniteQueryKey = (params?: LoginUserInfinite['queryParams']) => [{ url: `/user/login` }, ...(params ? [params] : [])] as const
export type LoginUserInfiniteQueryKey = ReturnType<typeof loginUserInfiniteQueryKey>
export function loginUserInfiniteQueryOptions<
  TQueryFnData extends LoginUserInfinite['data'] = LoginUserInfinite['data'],
  TError = LoginUserInfinite['error'],
  TData = LoginUserInfinite['response'],
  TQueryData = LoginUserInfinite['response'],
>(
  params?: LoginUserInfinite['queryParams'],
  options: LoginUserInfinite['client']['paramaters'] = {},
): UseInfiniteQueryOptions<LoginUserInfinite['unionResponse'], TError, TData, TQueryData, LoginUserInfiniteQueryKey> {
  const queryKey = loginUserInfiniteQueryKey(params)
  return {
    queryKey,
    queryFn: ({ pageParam }) => {
      return client<TQueryFnData, TError>({
        method: 'get',
        url: `/user/login`,
        ...options,
        params: {
          ...params,
          ['id']: pageParam,
          ...(options.params || {}),
        },
      }).then(res => res?.data || res)
    },
  }
} /**
 * @summary Logs user into the system
 * @link /user/login
 */

export function useLoginUserInfinite<
  TQueryFnData extends LoginUserInfinite['data'] = LoginUserInfinite['data'],
  TError = LoginUserInfinite['error'],
  TData = LoginUserInfinite['response'],
  TQueryData = LoginUserInfinite['response'],
  TQueryKey extends QueryKey = LoginUserInfiniteQueryKey,
>(params?: LoginUserInfinite['queryParams'], options: {
  query?: UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
  client?: LoginUserInfinite['client']['paramaters']
} = {}): UseInfiniteQueryResult<TData, TError> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? loginUserInfiniteQueryKey(params)
  const query = useInfiniteQuery<TQueryFnData, TError, TData, any>({
    ...loginUserInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryData>(params, clientOptions),
    queryKey,
    ...queryOptions,
  }) as UseInfiniteQueryResult<TData, TError> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
