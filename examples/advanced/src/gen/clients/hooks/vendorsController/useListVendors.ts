import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { QueryClient, QueryKey, QueryObserverOptions, UseQueryResult } from '../../../../tanstack-query-hook'
import { queryOptions, useQuery } from '../../../../tanstack-query-hook'
import type {
  ListVendors400,
  ListVendors401,
  ListVendors403,
  ListVendorsQueryParams,
  ListVendorsQueryResponse,
} from '../../../models/ts/vendorsController/ListVendors.ts'
import { listVendors } from '../../axios/VendorsService/listVendors.ts'

export const listVendorsQueryKey = (params?: ListVendorsQueryParams) => [{ url: '/v1/vendors' }, ...(params ? [params] : [])] as const

export type ListVendorsQueryKey = ReturnType<typeof listVendorsQueryKey>

export function listVendorsQueryOptions({ params }: { params?: ListVendorsQueryParams }, config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
  const queryKey = listVendorsQueryKey(params)
  return queryOptions<
    ResponseConfig<ListVendorsQueryResponse>,
    ResponseErrorConfig<ListVendors400 | ListVendors401 | ListVendors403>,
    ResponseConfig<ListVendorsQueryResponse>,
    typeof queryKey
  >({
    queryKey,
    queryFn: async ({ signal }) => {
      config.signal = signal
      return listVendors({ params }, config)
    },
  })
}

/**
 * @description This endpoint lists all existing vendors for an account.Takes an optional parameter to match by vendor name.
 * @summary Lists vendors
 * {@link /v1/vendors}
 */
export function useListVendors<
  TData = ResponseConfig<ListVendorsQueryResponse>,
  TQueryData = ResponseConfig<ListVendorsQueryResponse>,
  TQueryKey extends QueryKey = ListVendorsQueryKey,
>(
  { params }: { params?: ListVendorsQueryParams },
  options: {
    query?: Partial<
      QueryObserverOptions<
        ResponseConfig<ListVendorsQueryResponse>,
        ResponseErrorConfig<ListVendors400 | ListVendors401 | ListVendors403>,
        TData,
        TQueryData,
        TQueryKey
      >
    > & { client?: QueryClient }
    client?: Partial<RequestConfig> & { client?: typeof fetch }
  } = {},
) {
  const { query: queryConfig = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...queryOptions } = queryConfig
  const queryKey = queryOptions?.queryKey ?? listVendorsQueryKey(params)

  const query = useQuery(
    {
      ...listVendorsQueryOptions({ params }, config),
      queryKey,
      ...queryOptions,
    } as unknown as QueryObserverOptions,
    queryClient,
  ) as UseQueryResult<TData, ResponseErrorConfig<ListVendors400 | ListVendors401 | ListVendors403>> & { queryKey: TQueryKey }

  query.queryKey = queryKey as TQueryKey

  return query
}
