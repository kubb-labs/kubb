import useSWR from 'swr'
import type { SWRConfiguration, SWRResponse } from 'swr'
import client from '../../../../client'
import type { GetInventoryQueryResponse } from '../../../models/ts/storeController/GetInventory'

export function getInventoryQueryOptions<TData = GetInventoryQueryResponse, TError = unknown>(): SWRConfiguration<TData, TError> {
  return {
    fetcher: () => {
      return client<TData, TError>({
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
export function useGetInventory<TData = GetInventoryQueryResponse, TError = unknown>(options?: {
  query?: SWRConfiguration<TData, TError>
}): SWRResponse<TData, TError> {
  const { query: queryOptions } = options ?? {}

  const query = useSWR<TData, TError, string>(`/store/inventory`, {
    ...getInventoryQueryOptions<TData, TError>(),
    ...queryOptions,
  })

  return query
}
