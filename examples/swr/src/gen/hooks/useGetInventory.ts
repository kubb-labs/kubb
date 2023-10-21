import client from '@kubb/swagger-client/client'

import useSWR from 'swr'

import type { SWRConfiguration, SWRResponse } from 'swr'
import type { GetInventoryQueryResponse } from '../models/GetInventory'

export function getInventoryQueryOptions<TData = GetInventoryQueryResponse, TError = unknown>(
  options: Partial<Parameters<typeof client>[0]> = {},
): SWRConfiguration<TData, TError> {
  return {
    fetcher: () => {
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

export function useGetInventory<TData = GetInventoryQueryResponse, TError = unknown>(options?: {
  query?: SWRConfiguration<TData, TError>
  client?: Partial<Parameters<typeof client<TData, TError>>[0]>
  shouldFetch?: boolean
}): SWRResponse<TData, TError> {
  const { query: queryOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}

  const url = shouldFetch ? `/store/inventory` : null
  const query = useSWR<TData, TError, string | null>(url, {
    ...getInventoryQueryOptions<TData, TError>(clientOptions),
    ...queryOptions,
  })

  return query
}
