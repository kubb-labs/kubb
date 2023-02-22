import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { parseTemplate } from 'url-template'

import type { QueryKey, UseQueryResult, UseQueryOptions } from '@tanstack/react-query'
import type { LoginUserResponse, LoginUserParams } from '../models/ts/LoginUser'

export const loginUserQueryKey = (params?: LoginUserParams) => ['/user/login', ...(params ? [params] : [])] as const

/**
 * @summary Logs user into the system
 * @link /user/login
 */
export const useLoginUser = <TData = LoginUserResponse>(
  params: LoginUserParams,
  options?: { query?: UseQueryOptions<TData> }
): UseQueryResult<TData> & { queryKey: QueryKey } => {
  const { query: queryOptions } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? loginUserQueryKey(params)

  const query = useQuery<TData>({
    queryKey,
    queryFn: () => {
      const template = parseTemplate('/user/login').expand(params as any)
      return axios.get(template).then((res) => res.data)
    },
    ...queryOptions,
  }) as UseQueryResult<TData> & { queryKey: QueryKey }

  query.queryKey = queryKey

  return query
}
