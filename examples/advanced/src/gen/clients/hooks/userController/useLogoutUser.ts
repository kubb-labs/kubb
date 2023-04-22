import { useQuery } from '@tanstack/react-query'

import client from '../../../../client'

import type { QueryKey, UseQueryResult, UseQueryOptions, QueryOptions } from '@tanstack/react-query'
import type { LogoutUserQueryResponse } from '../../../models/ts/userController/LogoutUser'

export const logoutUserQueryKey = () => [`/user/logout`] as const

export function logoutUserQueryOptions<TData = LogoutUserQueryResponse, TError = unknown>(): QueryOptions<TData, TError> {
  const queryKey = logoutUserQueryKey()

  return {
    queryKey,
    queryFn: () => {
      return client<TData, TError>({
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
export function useLogoutUser<TData = LogoutUserQueryResponse, TError = unknown>(options?: {
  query?: UseQueryOptions<TData, TError>
}): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? logoutUserQueryKey()

  const query = useQuery<TData, TError>({
    ...logoutUserQueryOptions<TData, TError>(),
    ...queryOptions,
  }) as UseQueryResult<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey as QueryKey

  return query
}
