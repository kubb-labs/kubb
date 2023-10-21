import client from '@kubb/swagger-client/client'

import { createQuery } from '@tanstack/solid-query'

import type { CreateQueryOptions, CreateQueryResult, QueryKey } from '@tanstack/solid-query'
import type { GetInventoryQueryResponse } from '../models/GetInventory'

export const getInventoryQueryKey = () => [{ url: `/store/inventory` }] as const
export function getInventoryQueryOptions<TData = GetInventoryQueryResponse, TError = unknown>(
  options: Partial<Parameters<typeof client>[0]> = {},
): CreateQueryOptions<TData, TError> {
  const queryKey = () => getInventoryQueryKey()

  return {
    queryKey,
    queryFn: () => {
      return client<TData, TError>({
        method: 'get',
        url: `/store/inventory`,

        ...options,
      }).then((res) => res.data)
    },
  }
}

/**
 * @description Returns a map of status codes to quantities
 * @summary Returns pet inventories by status
 * @link /store/inventory
 */

export function getInventoryQuery<TData = GetInventoryQueryResponse, TError = unknown>(
  options: {
    query?: CreateQueryOptions<TData, TError>
    client?: Partial<Parameters<typeof client<TData, TError>>[0]>
  } = {},
): CreateQueryResult<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey?.() ?? getInventoryQueryKey()

  const query = createQuery<TData, TError>({
    ...getInventoryQueryOptions<TData, TError>(clientOptions),
    ...queryOptions,
  }) as CreateQueryResult<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey as QueryKey

  return query
}
