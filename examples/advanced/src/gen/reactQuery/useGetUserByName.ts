import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

import type { QueryKey, UseQueryResult, UseQueryOptions } from '@tanstack/react-query'
import type { GetUserByNameResponse, GetUserByNamePathParams, GetUserByNameQueryParams } from '../models/ts/GetUserByName'

export const getUserByNameQueryKey = (username: GetUserByNamePathParams['username'], params?: GetUserByNameQueryParams) =>
  [`/user/${username}`, ...(params ? [params] : [])] as const

/**
 * @summary Get user by user name
 * @link /user/{username}
 */
export const useGetUserByName = <TData = GetUserByNameResponse>(
  username: GetUserByNamePathParams['username'],
  params: GetUserByNameQueryParams,
  options?: { query?: UseQueryOptions<TData> }
): UseQueryResult<TData> & { queryKey: QueryKey } => {
  const { query: queryOptions } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getUserByNameQueryKey(username, params)

  const query = useQuery<TData>({
    queryKey,
    queryFn: () => {
      return axios.get(`/user/${username}`).then((res) => res.data)
    },
    ...queryOptions,
  }) as UseQueryResult<TData> & { queryKey: QueryKey }

  query.queryKey = queryKey

  return query
}
