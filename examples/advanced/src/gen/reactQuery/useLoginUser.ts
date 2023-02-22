import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

import type { QueryKey, UseQueryResult, UseQueryOptions } from '@tanstack/react-query'
import type { LoginUserResponse, LoginUserQueryParams } from '../models/ts/LoginUser'

export const loginUserQueryKey = (params?: LoginUserQueryParams) => [`/user/login`, ...(params ? [params] : [])] as const

/**
 * @summary Logs user into the system
 * @link /user/login
 */
export const useLoginUser = <TData = LoginUserResponse>(
  params: LoginUserQueryParams,
  options?: { query?: UseQueryOptions<TData> }
): UseQueryResult<TData> & { queryKey: QueryKey } => {
  const { query: queryOptions } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? loginUserQueryKey(params)

  const query = useQuery<TData>({
    queryKey,
    queryFn: () => {
      return axios.get(`/user/login`).then((res) => res.data)
    },
    ...queryOptions,
  }) as UseQueryResult<TData> & { queryKey: QueryKey }

  query.queryKey = queryKey

  return query
}
