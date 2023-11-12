import client from '@kubb/swagger-client/client'
import { createQuery, createInfiniteQuery } from '@tanstack/svelte-query'
import type { KubbQueryFactory } from './types'
import type { LoginUserQueryResponse, LoginUserQueryParams, LoginUser400 } from '../models/LoginUser'
import type { CreateBaseQueryOptions, CreateQueryResult, QueryKey, CreateInfiniteQueryOptions, CreateInfiniteQueryResult } from '@tanstack/svelte-query'

type LoginUser = KubbQueryFactory<
  LoginUserQueryResponse,
  LoginUser400,
  never,
  never,
  LoginUserQueryParams,
  never,
  LoginUserQueryResponse,
  {
    dataReturnType: 'data'
    type: 'query'
  }
>
export const loginUserQueryKey = (params?: LoginUser['queryParams']) => [{ url: '/user/login' }, ...(params ? [params] : [])] as const
export type LoginUserQueryKey = ReturnType<typeof loginUserQueryKey>
export function loginUserQueryOptions<
  TQueryFnData extends LoginUser['data'] = LoginUser['data'],
  TError = LoginUser['error'],
  TData = LoginUser['response'],
  TQueryData = LoginUser['response'],
>(
  params?: LoginUser['queryParams'],
  options: LoginUser['client']['paramaters'] = {},
): CreateBaseQueryOptions<LoginUser['unionResponse'], TError, TData, TQueryData, LoginUserQueryKey> {
  const queryKey = loginUserQueryKey(params)
  return {
    queryKey,
    queryFn: () => {
      return client<TQueryFnData, TError>({
        method: 'get',
        url: `/user/login`,
        params,
        ...options,
      }).then((res) => res?.data || res)
    },
  }
} /**
 * @summary Logs user into the system
 * @link /user/login
 */

export function loginUserQuery<
  TQueryFnData extends LoginUser['data'] = LoginUser['data'],
  TError = LoginUser['error'],
  TData = LoginUser['response'],
  TQueryData = LoginUser['response'],
  TQueryKey extends QueryKey = LoginUserQueryKey,
>(
  params?: LoginUser['queryParams'],
  options: {
    query?: CreateBaseQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
    client?: LoginUser['client']['paramaters']
  } = {},
): CreateQueryResult<TData, TError> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? loginUserQueryKey(params)
  const query = createQuery<TQueryFnData, TError, TData, any>({
    ...loginUserQueryOptions<TQueryFnData, TError, TData, TQueryData>(params, clientOptions),
    queryKey,
    ...queryOptions,
  }) as CreateQueryResult<TData, TError> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
type LoginUserInfinite = KubbQueryFactory<
  LoginUserQueryResponse,
  LoginUser400,
  never,
  never,
  LoginUserQueryParams,
  never,
  LoginUserQueryResponse,
  {
    dataReturnType: 'data'
    type: 'query'
  }
>
export const loginUserInfiniteQueryKey = (params?: LoginUserInfinite['queryParams']) => [{ url: '/user/login' }, ...(params ? [params] : [])] as const
export type LoginUserInfiniteQueryKey = ReturnType<typeof loginUserInfiniteQueryKey>
export function loginUserInfiniteQueryOptions<
  TQueryFnData extends LoginUserInfinite['data'] = LoginUserInfinite['data'],
  TError = LoginUserInfinite['error'],
  TData = LoginUserInfinite['response'],
  TQueryData = LoginUserInfinite['response'],
>(
  params?: LoginUserInfinite['queryParams'],
  options: LoginUserInfinite['client']['paramaters'] = {},
): CreateInfiniteQueryOptions<LoginUserInfinite['unionResponse'], TError, TData, TQueryData, LoginUserInfiniteQueryKey> {
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
      }).then((res) => res?.data || res)
    },
  }
} /**
 * @summary Logs user into the system
 * @link /user/login
 */

export function loginUserQueryInfinite<
  TQueryFnData extends LoginUserInfinite['data'] = LoginUserInfinite['data'],
  TError = LoginUserInfinite['error'],
  TData = LoginUserInfinite['response'],
  TQueryData = LoginUserInfinite['response'],
  TQueryKey extends QueryKey = LoginUserInfiniteQueryKey,
>(
  params?: LoginUserInfinite['queryParams'],
  options: {
    query?: CreateInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
    client?: LoginUserInfinite['client']['paramaters']
  } = {},
): CreateInfiniteQueryResult<TData, TError> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? loginUserInfiniteQueryKey(params)
  const query = createInfiniteQuery<TQueryFnData, TError, TData, any>({
    ...loginUserInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryData>(params, clientOptions),
    queryKey,
    ...queryOptions,
  }) as CreateInfiniteQueryResult<TData, TError> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
