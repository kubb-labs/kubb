import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { parseTemplate } from 'url-template'

import type { QueryKey, UseQueryResult, UseQueryOptions } from '@tanstack/react-query'
import type { GetUserByNameResponse, GetUserByNameParams } from '../models/ts/GetUserByName'

export const getUserByNameQueryKey = (params?: GetUserByNameParams) => ['/user/{username}', ...(params ? [params] : [])] as const

/**
 * @summary Get user by user name
 * @link /user/{username}
 */
export const useGetUserByName = <TData = GetUserByNameResponse>(
  params: GetUserByNameParams,
  options?: { query?: UseQueryOptions<TData> }
): UseQueryResult<TData> & { queryKey: QueryKey } => {
  const { query: queryOptions } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getUserByNameQueryKey(params)

  const query = useQuery<TData>({
    queryKey,
    queryFn: () => {
      const template = parseTemplate('/user/{username}').expand(params as any)
      return axios.get(template).then((res) => res.data)
    },
    ...queryOptions,
  }) as UseQueryResult<TData> & { queryKey: QueryKey }

  query.queryKey = queryKey

  return query
}
