import client from '@kubb/swagger-client/client'
import { useQuery } from '@tanstack/vue-query'
import { unref } from 'vue'
import type { LoginUserQueryResponse, LoginUserQueryParams, LoginUser400 } from '../models/LoginUser'
import type { UseQueryReturnType, QueryKey, WithRequired } from '@tanstack/vue-query'
import type { VueQueryObserverOptions } from '@tanstack/vue-query/build/lib/types'
import type { MaybeRef } from 'vue'

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
export const loginUserQueryKey = (params?: MaybeRef<LoginUser['queryParams']>) => [{ url: '/user/login' }, ...(params ? [params] : [])] as const
export type LoginUserQueryKey = ReturnType<typeof loginUserQueryKey>
export function loginUserQueryOptions<TData = LoginUser['response'], TQueryData = LoginUser['response']>(
  refParams?: MaybeRef<LoginUserQueryParams>,
  options: LoginUser['client']['parameters'] = {},
): WithRequired<VueQueryObserverOptions<LoginUser['response'], LoginUser['error'], TData, TQueryData>, 'queryKey'> {
  const queryKey = loginUserQueryKey(refParams)
  return {
    queryKey,
    queryFn: async () => {
      const params = unref(refParams)
      const res = await client<LoginUser['data'], LoginUser['error']>({
        method: 'get',
        url: '/user/login',
        params,
        ...options,
      })
      return res.data
    },
  }
}
/**
 * @summary Logs user into the system
 * @link /user/login
 */
export function useLoginUser<TData = LoginUser['response'], TQueryData = LoginUser['response'], TQueryKey extends QueryKey = LoginUserQueryKey>(
  refParams?: MaybeRef<LoginUserQueryParams>,
  options: {
    query?: Partial<VueQueryObserverOptions<LoginUser['response'], LoginUser['error'], TData, TQueryKey>>
    client?: LoginUser['client']['parameters']
  } = {},
): UseQueryReturnType<TData, LoginUser['error']> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? loginUserQueryKey(refParams)
  const query = useQuery<LoginUser['data'], LoginUser['error'], TData, any>({
    ...loginUserQueryOptions<TData, TQueryData>(refParams, clientOptions),
    queryKey,
    ...queryOptions,
  }) as UseQueryReturnType<TData, LoginUser['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
