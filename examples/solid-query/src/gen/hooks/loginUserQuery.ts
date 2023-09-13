import type { QueryKey, CreateQueryResult, CreateQueryOptions } from '@tanstack/solid-query'
import { createQuery } from '@tanstack/solid-query'
import client from '@kubb/swagger-client/client'
import type { LoginUserQueryResponse, LoginUserQueryParams, LoginUser400 } from '../models/LoginUser'

export const loginUserQueryKey = (params?: LoginUserQueryParams) => [`/user/login`, ...(params ? [params] : [])] as const
export function loginUserQueryOptions<TData = LoginUserQueryResponse, TError = LoginUser400>(
  params?: LoginUserQueryParams,
  options: Partial<Parameters<typeof client>[0]> = {},
): CreateQueryOptions<TData, TError> {
  const queryKey = () => loginUserQueryKey(params)
  return {
    queryKey,
    queryFn: () => {
      return client<TData, TError>({
        method: 'get',
        url: `/user/login`,
        params,
        ...options,
      })
    },
  }
}

/**
 * @summary Logs user into the system
 * @link /user/login
 */
export function loginUserQuery<TData = LoginUserQueryResponse, TError = LoginUser400>(
  params?: LoginUserQueryParams,
  options?: { query?: CreateQueryOptions<TData, TError> },
): CreateQueryResult<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions } = options ?? {}
  const queryKey = queryOptions?.queryKey?.() ?? loginUserQueryKey(params)
  const query = createQuery<TData, TError>({
    ...loginUserQueryOptions<TData, TError>(params),
    ...queryOptions,
  }) as CreateQueryResult<TData, TError> & { queryKey: QueryKey }
  query.queryKey = queryKey as QueryKey
  return query
}
