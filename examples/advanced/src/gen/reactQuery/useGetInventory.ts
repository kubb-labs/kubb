import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

import type { QueryKey, UseQueryResult, UseQueryOptions } from '@tanstack/react-query'
import type { GetInventoryResponse } from '../models/ts/GetInventory'

export const getInventoryQueryKey = () => [`/store/inventory`] as const

/**
 * @description Returns a map of status codes to quantities
 * @summary Returns pet inventories by status
 * @link /store/inventory
 */
export const useGetInventory = <TData = GetInventoryResponse>(options?: { query?: UseQueryOptions<TData> }): UseQueryResult<TData> & { queryKey: QueryKey } => {
  const { query: queryOptions } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getInventoryQueryKey()

  const query = useQuery<TData>({
    queryKey,
    queryFn: () => {
      return axios.get(`/store/inventory`).then((res) => res.data)
    },
    ...queryOptions,
  }) as UseQueryResult<TData> & { queryKey: QueryKey }

  query.queryKey = queryKey

  return query
}
