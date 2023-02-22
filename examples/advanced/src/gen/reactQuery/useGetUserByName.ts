import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { parseTemplate } from 'url-template'

import type { QueryKey, UseQueryResult, UseQueryOptions } from '@tanstack/react-query'
import type { GetUserByNameResponse, GetUserByNamePathParams, GetUserByNameQueryParams } from '../models/ts/GetUserByName'

export const getUserByNameQueryKey = (pathParams?: GetUserByNamePathParams, queryParams?: GetUserByNameQueryParams) =>
  ['/user/{username}', ...(pathParams ? [pathParams] : []), ...(queryParams ? [queryParams] : [])] as const

/**
 * @summary Get user by user name
 * @link /user/{username}
 */
export const useGetUserByName = <TData = GetUserByNameResponse>(
  pathParams: GetUserByNamePathParams,
  queryParams: GetUserByNameQueryParams,
  options?: { query?: UseQueryOptions<TData> }
): UseQueryResult<TData> & { queryKey: QueryKey } => {
  const { query: queryOptions } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getUserByNameQueryKey(pathParams, queryParams)

  const query = useQuery<TData>({
    queryKey,
    queryFn: () => {
      const template = parseTemplate('/user/{username}').expand(pathParams as any)
      return axios.get(template).then((res) => res.data)
    },
    ...queryOptions,
  }) as UseQueryResult<TData> & { queryKey: QueryKey }

  query.queryKey = queryKey

  return query
}
