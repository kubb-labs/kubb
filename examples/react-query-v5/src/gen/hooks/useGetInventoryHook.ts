import { useQuery, queryOptions } from '@tanstack/react-query'
import client from '@kubb/swagger-client/client'
import type { QueryKey, UseQueryResult, UseQueryOptions, QueryOptions } from '@tanstack/react-query'
import type { GetInventoryQueryResponse } from '../models/GetInventory'

export const getInventoryQueryKey = () => [{ url: `/store/inventory` }] as const
export function getInventoryQueryOptions<TData = GetInventoryQueryResponse, TError = unknown>(
  options: Partial<Parameters<typeof client>[0]> = {},
): UseQueryOptions<TData, TError> {
  const queryKey = getInventoryQueryKey()

  return queryOptions({
    queryKey: queryKey as QueryKey,
    queryFn: () => {
      return client<TData, TError>({
        method: 'get',
        url: `/store/inventory`,

        ...options,
      }).then(res => res.data)
    },
  })
}

/**
 * @description Returns a map of status codes to quantities
 * @summary Returns pet inventories by status
 * @link /store/inventory
 */

export function useGetInventoryHook<TData = GetInventoryQueryResponse, TError = unknown>(options: {
  query?: UseQueryOptions<TData, TError>
  client?: Partial<Parameters<typeof client<TData, TError>>[0]>
} = {}): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getInventoryQueryKey()

  const query = useQuery<TData, TError>({
    ...getInventoryQueryOptions<TData, TError>(clientOptions),
    ...queryOptions,
  }) as UseQueryResult<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey as QueryKey

  return query
}
