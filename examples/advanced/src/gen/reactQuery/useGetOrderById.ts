import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { parseTemplate } from 'url-template'

import type { QueryKey, UseQueryResult, UseQueryOptions } from '@tanstack/react-query'
import type { GetOrderByIdResponse, GetOrderByIdPathParams, GetOrderByIdQueryParams } from '../models/ts/GetOrderById'

export const getOrderByIdQueryKey = (pathParams?: GetOrderByIdPathParams, queryParams?: GetOrderByIdQueryParams) =>
  ['/store/order/{orderId}', ...(pathParams ? [pathParams] : []), ...(queryParams ? [queryParams] : [])] as const

/**
 * @description For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.
 * @summary Find purchase order by ID
 * @link /store/order/{orderId}
 */
export const useGetOrderById = <TData = GetOrderByIdResponse>(
  pathParams: GetOrderByIdPathParams,
  queryParams: GetOrderByIdQueryParams,
  options?: { query?: UseQueryOptions<TData> }
): UseQueryResult<TData> & { queryKey: QueryKey } => {
  const { query: queryOptions } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getOrderByIdQueryKey(pathParams, queryParams)

  const query = useQuery<TData>({
    queryKey,
    queryFn: () => {
      const template = parseTemplate('/store/order/{orderId}').expand(pathParams as any)
      return axios.get(template).then((res) => res.data)
    },
    ...queryOptions,
  }) as UseQueryResult<TData> & { queryKey: QueryKey }

  query.queryKey = queryKey

  return query
}
