import { unref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import client from '@kubb/swagger-client/client'
import type { KubbQueryFactory } from './types'
import type { MaybeRef } from 'vue'
import type { QueryKey, QueryObserverOptions, UseQueryReturnType } from '@tanstack/vue-query'
import type { LoginUserQueryResponse, LoginUserQueryParams, LoginUser400 } from '../models/LoginUser'

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
export const loginUserQueryKey = (params?: MaybeRef<LoginUser['queryParams']>) => [{ url: `/user/login` }, ...(params ? [params] : [])] as const
export type LoginUserQueryKey = ReturnType<typeof loginUserQueryKey>
export function loginUserQueryOptions<
  TQueryFnData extends LoginUser['data'] = LoginUser['data'],
  TError = LoginUser['error'],
  TData = LoginUser['response'],
  TQueryData = LoginUser['response'],
>(
  refParams?: MaybeRef<LoginUserQueryParams>,
  options: LoginUser['client']['paramaters'] = {},
): QueryObserverOptions<LoginUser['unionResponse'], TError, TData, TQueryData, LoginUserQueryKey> {
  const queryKey = loginUserQueryKey(refParams)

  return {
    queryKey,
    queryFn: () => {
      const params = unref(refParams)
      return client<TQueryFnData, TError>({
        method: 'get',
        url: `/user/login`,
        params,
        ...options,
      }).then((res) => res?.data || res)
    },
  }
}
/**
 * @summary Logs user into the system
 * @link /user/login
 */
export function useLoginUser<
  TQueryFnData extends LoginUser['data'] = LoginUser['data'],
  TError = LoginUser['error'],
  TData = LoginUser['response'],
  TQueryData = LoginUser['response'],
  TQueryKey extends QueryKey = LoginUserQueryKey,
>(
  refParams?: MaybeRef<LoginUserQueryParams>,
  options: {
    query?: QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
    client?: LoginUser['client']['paramaters']
  } = {},
): UseQueryReturnType<TData, TError> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? loginUserQueryKey(refParams)

  const query = useQuery<any, TError, TData, any>({
    ...loginUserQueryOptions<TQueryFnData, TError, TData, TQueryData>(refParams, clientOptions),
    queryKey,
    ...queryOptions,
  }) as UseQueryReturnType<TData, TError> & {
    queryKey: TQueryKey
  }

  query.queryKey = queryKey as TQueryKey

  return query
}
