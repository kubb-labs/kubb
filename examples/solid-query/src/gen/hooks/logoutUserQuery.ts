import type { QueryKey, CreateQueryResult, CreateQueryOptions } from '@tanstack/solid-query'
import { createQuery } from '@tanstack/solid-query'
import client from '@kubb/swagger-client/client'
import type { LogoutUserQueryResponse } from '../models/LogoutUser'

export const logoutUserQueryKey = () => [`/user/logout`] as const

export function logoutUserQueryOptions<TData = LogoutUserQueryResponse, TError = unknown>(
  options: Partial<Parameters<typeof client>[0]> = {},
): CreateQueryOptions<TData, TError> {
  const queryKey = () => logoutUserQueryKey()

  return {
    queryKey,
    queryFn: () => {
      return client<TData, TError>({
        method: 'get',
        url: `/user/logout`,

        ...options,
      })
    },
  }
}

/**
 * @summary Logs out current logged in user session
 * @link /user/logout
 */
export function logoutUserQuery<TData = LogoutUserQueryResponse, TError = unknown>(options?: {
  query?: CreateQueryOptions<TData, TError>
}): CreateQueryResult<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions } = options ?? {}
  const queryKey = queryOptions?.queryKey?.() ?? logoutUserQueryKey()

  const query = createQuery<TData, TError>({
    ...logoutUserQueryOptions<TData, TError>(),
    ...queryOptions,
  }) as CreateQueryResult<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey as QueryKey

  return query
}
