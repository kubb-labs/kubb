import useSWR from 'swr'
import client from '@kubb/swagger-client/client'
import type { SWRConfiguration, SWRResponse } from 'swr'
import type { GetInventoryQueryResponse } from '../models/GetInventory'

type GetInventoryClient = typeof client<GetInventoryQueryResponse, never, never>
type GetInventory = {
  data: GetInventoryQueryResponse
  error: never
  request: never
  pathParams: never
  queryParams: never
  headerParams: never
  response: GetInventoryQueryResponse
  client: {
    paramaters: Partial<Parameters<GetInventoryClient>[0]>
    return: Awaited<ReturnType<GetInventoryClient>>
  }
}
export function getInventoryQueryOptions<TData extends GetInventory['response'] = GetInventory['response'], TError = GetInventory['error']>(
  options: GetInventory['client']['paramaters'] = {},
): SWRConfiguration<TData, TError> {
  return {
    fetcher: async () => {
      const res = await client<TData, TError>({
        method: 'get',
        url: `/store/inventory`,
        ...options,
      })
      return res.data
    },
  }
}
/**
 * @description Returns a map of status codes to quantities
 * @summary Returns pet inventories by status
 * @link /store/inventory */
export function useGetInventory<TData extends GetInventory['response'] = GetInventory['response'], TError = GetInventory['error']>(options?: {
  query?: SWRConfiguration<TData, TError>
  client?: GetInventory['client']['paramaters']
  shouldFetch?: boolean
}): SWRResponse<TData, TError> {
  const { query: queryOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}
  const url = `/store/inventory` as const
  const query = useSWR<TData, TError, typeof url | null>(shouldFetch ? url : null, {
    ...getInventoryQueryOptions<TData, TError>(clientOptions),
    ...queryOptions,
  })
  return query
}
