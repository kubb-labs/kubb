import client from '@kubb/swagger-client/client'
import { useQuery, queryOptions } from '@tanstack/vue-query'
import { unref } from 'vue'
import type { LoginUserQueryResponse, LoginUserQueryParams, LoginUser400 } from '../models/LoginUser'
import type { QueryObserverOptions, UseQueryReturnType, QueryKey } from '@tanstack/vue-query'
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
export function loginUserQueryOptions(refParams?: MaybeRef<LoginUserQueryParams>, options: LoginUser['client']['parameters'] = {}) {
  const queryKey = loginUserQueryKey(refParams)

  return queryOptions({
    queryKey,
    queryFn: async () => {
      const params = unref(refParams)
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
 * @link /user/login */

export function useLoginUser<TData = LoginUser['response'], TQueryData = LoginUser['response'], TQueryKey extends QueryKey = LoginUserQueryKey>(
  refParams?: MaybeRef<LoginUserQueryParams>,
  options: {
    query?: Partial<QueryObserverOptions<LoginUser['response'], LoginUser['error'], TData, TQueryKey>>
    client?: LoginUser['client']['parameters']
  } = {},
): UseQueryReturnType<TData, LoginUser['error']> & { queryKey: TQueryKey } {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? loginUserQueryKey(refParams)

  const query = useQuery({
    ...(loginUserQueryOptions(refParams, clientOptions) as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, 'queryKey'>),
  }) as UseQueryReturnType<TData, LoginUser['error']> & { queryKey: TQueryKey }

  query.queryKey = queryKey as TQueryKey

  return query
}
