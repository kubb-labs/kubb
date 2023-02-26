import { useQuery } from '@tanstack/react-query'

import client from '../../../client'

import type { QueryKey, UseQueryResult, UseQueryOptions, QueryOptions } from '@tanstack/react-query'
import type { LogoutUserResponse } from '../../models/ts/LogoutUser'

export const logoutUserQueryKey = () => [`/user/logout`] as const

export const logoutUserQueryOptions = <TData = LogoutUserResponse>(): QueryOptions<TData> => {
  const queryKey = logoutUserQueryKey()

  return {
    queryKey,
    queryFn: () => {
      return client<TData>({
        method: 'get',
        url: `/user/logout`,
      })
    },
  }
}

/**
 * @summary Logs out current logged in user session
 * @link /user/logout
 */
export const useLogoutUser = <TData = LogoutUserResponse>(options?: { query?: UseQueryOptions<TData> }): UseQueryResult<TData> & { queryKey: QueryKey } => {
  const { query: queryOptions } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? logoutUserQueryKey()

  const query = useQuery<TData>({
    ...logoutUserQueryOptions<TData>(),
    ...queryOptions,
  }) as UseQueryResult<TData> & { queryKey: QueryKey }

  query.queryKey = queryKey

  return query
}
