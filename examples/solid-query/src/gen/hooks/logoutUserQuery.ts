import client from '@kubb/swagger-client/client'

import { createQuery } from '@tanstack/solid-query'

import type { CreateQueryOptions, CreateQueryResult, QueryKey } from '@tanstack/solid-query'
import type { LogoutUserQueryResponse } from '../models/LogoutUser'

export const logoutUserQueryKey = () => [{ url: `/user/logout` }] as const
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
      }).then((res) => res.data)
    },
  }
}

/**
 * @summary Logs out current logged in user session
 * @link /user/logout
 */

export function logoutUserQuery<TData = LogoutUserQueryResponse, TError = unknown>(
  options: {
    query?: CreateQueryOptions<TData, TError>
    client?: Partial<Parameters<typeof client<TData, TError>>[0]>
  } = {},
): CreateQueryResult<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey?.() ?? logoutUserQueryKey()

  const query = createQuery<TData, TError>({
    ...logoutUserQueryOptions<TData, TError>(clientOptions),
    ...queryOptions,
  }) as CreateQueryResult<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey as QueryKey

  return query
}
