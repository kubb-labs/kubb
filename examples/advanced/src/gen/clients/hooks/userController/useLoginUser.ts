import { useQuery } from '@tanstack/react-query'

import client from '../../../../client'

import type { QueryKey, UseQueryResult, UseQueryOptions, QueryOptions } from '@tanstack/react-query'
import type { LoginUserResponse, LoginUserQueryParams, LoginUser400 } from '../../../models/ts/userController/LoginUser'

export const loginUserQueryKey = (params?: LoginUserQueryParams) => [`/user/login`, ...(params ? [params] : [])] as const

export function loginUserQueryOptions<TData = LoginUserResponse>(params?: LoginUserQueryParams): QueryOptions<TData> {
  const queryKey = loginUserQueryKey(params)

  return {
    queryKey,
    queryFn: () => {
      return client<TData>({
        method: 'get',
        url: `/user/login`,
        params,
      })
    },
  }
}

/**
 * @summary Logs user into the system
 * @link /user/login
 */
export function useLoginUser<TData = LoginUserResponse, TError = LoginUser400>(
  params?: LoginUserQueryParams,
  options?: { query?: UseQueryOptions<TData> }
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? loginUserQueryKey(params)

  const query = useQuery<TData, TError>({
    ...loginUserQueryOptions<TData>(params),
    ...queryOptions,
  }) as UseQueryResult<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey as QueryKey

  return query
}
