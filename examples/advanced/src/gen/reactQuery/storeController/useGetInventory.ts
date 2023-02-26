import { useQuery } from '@tanstack/react-query'

import client from '../../../client'

import type { QueryKey, UseQueryResult, UseQueryOptions, QueryOptions } from '@tanstack/react-query'
import type { GetInventoryResponse } from '../../models/ts/GetInventory'

export const getInventoryQueryKey = () => [`/store/inventory`] as const

export const getInventoryQueryOptions = <TData = GetInventoryResponse>(): QueryOptions<TData> => {
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
export const useGetInventory = <TData = GetInventoryResponse>(options?: { query?: UseQueryOptions<TData> }): UseQueryResult<TData> & { queryKey: QueryKey } => {
  const { query: queryOptions } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getInventoryQueryKey()

  const query = useQuery<TData>({
    ...getInventoryQueryOptions<TData>(),
    ...queryOptions,
  }) as UseQueryResult<TData> & { queryKey: QueryKey }

  query.queryKey = queryKey

  return query
}
