import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { parseTemplate } from 'url-template'

import type { QueryKey, UseQueryResult, UseQueryOptions } from '@tanstack/react-query'
import type { LoginUserResponse, LoginUserPathParams, LoginUserQueryParams } from '../models/ts/LoginUser'

export const loginUserQueryKey = (pathParams?: LoginUserPathParams, queryParams?: LoginUserQueryParams) =>
  ['/user/login', ...(pathParams ? [pathParams] : []), ...(queryParams ? [queryParams] : [])] as const

/**
 * @summary Logs user into the system
 * @link /user/login
 */
export const useLoginUser = <TData = LoginUserResponse>(
  pathParams: LoginUserPathParams,
  queryParams: LoginUserQueryParams,
  options?: { query?: UseQueryOptions<TData> }
): UseQueryResult<TData> & { queryKey: QueryKey } => {
  const { query: queryOptions } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? loginUserQueryKey(pathParams, queryParams)

  const query = useQuery<TData>({
    queryKey,
    queryFn: () => {
      const template = parseTemplate('/user/login').expand(pathParams as any)
      return axios.get(template).then((res) => res.data)
    },
    ...queryOptions,
  }) as UseQueryResult<TData> & { queryKey: QueryKey }

  query.queryKey = queryKey

  return query
}
