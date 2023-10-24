import client from '@kubb/swagger-client/client'

import { useQuery } from '@tanstack/vue-query'
import { unref } from 'vue'

import type { QueryKey, QueryObserverOptions, UseQueryOptions, UseQueryReturnType } from '@tanstack/vue-query'
import type { MaybeRef } from 'vue'
import type { LoginUser400, LoginUserQueryParams, LoginUserQueryResponse } from '../models/LoginUser'

export const loginUserQueryKey = (params?: MaybeRef<LoginUserQueryParams>) => [{ url: `/user/login` }, ...(params ? [params] : [])] as const
export function loginUserQueryOptions<TData = LoginUserQueryResponse, TError = LoginUser400>(
  refParams?: MaybeRef<LoginUserQueryParams>,
  options: Partial<Parameters<typeof client>[0]> = {},
): UseQueryOptions<TData, TError> {
  const queryKey = loginUserQueryKey(refParams)
  return {
    queryKey,
    queryFn: () => {
      const params = unref(refParams)
      return client<TData, TError>({
        method: 'get',
        url: `/user/login`,
        params,
        ...options,
      }).then((res) => res.data)
    },
  }
}
/**
 * @summary Logs user into the system
 * @link /user/login
 */
export function useLoginUser<TData = LoginUserQueryResponse, TError = LoginUser400>(
  refParams?: MaybeRef<LoginUserQueryParams>,
  options: {
    query?: QueryObserverOptions<TData, TError>
    client?: Partial<Parameters<typeof client<TData, TError>>[0]>
  } = {},
): UseQueryReturnType<TData, TError> & {
  queryKey: QueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? loginUserQueryKey(refParams)
  const query = useQuery<TData, TError>({
    ...loginUserQueryOptions<TData, TError>(refParams, clientOptions),
    ...queryOptions,
  }) as UseQueryReturnType<TData, TError> & {
    queryKey: QueryKey
  }
  query.queryKey = queryKey
  return query
}
