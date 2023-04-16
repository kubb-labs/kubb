import { useQuery } from '@tanstack/react-query'

import client from '../../../../client'

import type { QueryKey, UseQueryResult, UseQueryOptions, QueryOptions } from '@tanstack/react-query'
import type { GetInventoryResponse } from '../../../models/ts/storeController/GetInventory'

export const getInventoryQueryKey = () => [`/store/inventory`] as const

export function getInventoryQueryOptions<TData = GetInventoryResponse, TError = unknown>(): QueryOptions<TData, TError> {
  const queryKey = getInventoryQueryKey()

  return {
    queryKey,
    queryFn: () => {
      return client<TData>({
        method: 'get',
        url: `/store/inventory`,
      })
    },
  }
}

/**
 * @description Returns a map of status codes to quantities
 * @summary Returns pet inventories by status
 * @link /store/inventory
 */
export function useGetInventory<TData = GetInventoryResponse, TError = unknown>(options?: {
  query?: UseQueryOptions<TData, TError>
}): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getInventoryQueryKey()

  const query = useQuery<TData, TError>({
    ...getInventoryQueryOptions<TData, TError>(),
    ...queryOptions,
  }) as UseQueryResult<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey as QueryKey

  return query
}
