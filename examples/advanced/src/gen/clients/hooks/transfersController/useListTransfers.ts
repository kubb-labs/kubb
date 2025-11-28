import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { QueryKey, QueryClient, QueryObserverOptions, UseQueryResult } from '../../../../tanstack-query-hook'
import type {
  ListTransfersQueryResponse,
  ListTransfersQueryParams,
  ListTransfers400,
  ListTransfers401,
  ListTransfers403,
  ListTransfers500,
} from '../../../models/ts/transfersController/ListTransfers.ts'
import { queryOptions, useQuery } from '../../../../tanstack-query-hook'
import { listTransfers } from '../../axios/TransfersService/listTransfers.ts'

export const listTransfersQueryKey = (params?: ListTransfersQueryParams) => [{ url: '/v1/transfers' }, ...(params ? [params] : [])] as const

export type ListTransfersQueryKey = ReturnType<typeof listTransfersQueryKey>

export function listTransfersQueryOptions({ params }: { params?: ListTransfersQueryParams }, config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
  const queryKey = listTransfersQueryKey(params)
  return queryOptions<
    ResponseConfig<ListTransfersQueryResponse>,
    ResponseErrorConfig<ListTransfers400 | ListTransfers401 | ListTransfers403 | ListTransfers500>,
    ResponseConfig<ListTransfersQueryResponse>,
    typeof queryKey
  >({
    queryKey,
    queryFn: async ({ signal }) => {
      config.signal = signal
      return listTransfers({ params }, config)
    },
  })
}

/**
 * @description This endpoint lists existing transfers for an account.Currently, the API can only return transfers for the following payment rails:- ACH- DOMESTIC_WIRE- CHEQUE- INTERNATIONAL_WIRE
 * @summary Lists transfers
 * {@link /v1/transfers}
 */
export function useListTransfers<
  TData = ResponseConfig<ListTransfersQueryResponse>,
  TQueryData = ResponseConfig<ListTransfersQueryResponse>,
  TQueryKey extends QueryKey = ListTransfersQueryKey,
>(
  { params }: { params?: ListTransfersQueryParams },
  options: {
    query?: Partial<
      QueryObserverOptions<
        ResponseConfig<ListTransfersQueryResponse>,
        ResponseErrorConfig<ListTransfers400 | ListTransfers401 | ListTransfers403 | ListTransfers500>,
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
  const queryKey = queryOptions?.queryKey ?? listTransfersQueryKey(params)

  const query = useQuery(
    {
      ...listTransfersQueryOptions({ params }, config),
      queryKey,
      ...queryOptions,
    } as unknown as QueryObserverOptions,
    queryClient,
  ) as UseQueryResult<TData, ResponseErrorConfig<ListTransfers400 | ListTransfers401 | ListTransfers403 | ListTransfers500>> & { queryKey: TQueryKey }

  query.queryKey = queryKey as TQueryKey

  return query
}
