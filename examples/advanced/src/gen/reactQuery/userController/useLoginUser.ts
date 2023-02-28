import { useQuery } from '@tanstack/react-query'

import client from '../../../client'

import type { QueryKey, UseQueryResult, UseQueryOptions, QueryOptions } from '@tanstack/react-query'
import type { LoginUserResponse, LoginUserQueryParams } from '../../models/ts/LoginUser'

export const loginUserQueryKey = (params?: LoginUserQueryParams) => [`/user/login`, ...(params ? [params] : [])] as const

export const loginUserQueryOptions = <TData = LoginUserResponse>(params?: LoginUserQueryParams): QueryOptions<TData> => {
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
 * @deprecated
 */
export const useLoginUser = <TData = LoginUserResponse>(
  params?: LoginUserQueryParams,
  options?: { query?: UseQueryOptions<TData> }
): UseQueryResult<TData> & { queryKey: QueryKey } => {
  const { query: queryOptions } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? loginUserQueryKey(params)

  const query = useQuery<TData>({
    ...loginUserQueryOptions<TData>(params),
    ...queryOptions,
  }) as UseQueryResult<TData> & { queryKey: QueryKey }

  query.queryKey = queryKey

  return query
}
