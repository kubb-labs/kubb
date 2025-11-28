import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { QueryKey, QueryClient, QueryObserverOptions, UseQueryResult } from '../../../../tanstack-query-hook'
import type {
  GetTransfersByIdQueryResponse,
  GetTransfersByIdPathParams,
  GetTransfersById400,
  GetTransfersById401,
  GetTransfersById403,
  GetTransfersById500,
} from '../../../models/ts/transfersController/GetTransfersById.ts'
import { queryOptions, useQuery } from '../../../../tanstack-query-hook'
import { getTransfersById } from '../../axios/TransfersService/getTransfersById.ts'

export const getTransfersByIdQueryKey = ({ id }: { id: GetTransfersByIdPathParams['id'] }) => [{ url: '/v1/transfers/:id', params: { id: id } }] as const

export type GetTransfersByIdQueryKey = ReturnType<typeof getTransfersByIdQueryKey>

export function getTransfersByIdQueryOptions(
  { id }: { id: GetTransfersByIdPathParams['id'] },
  config: Partial<RequestConfig> & { client?: typeof fetch } = {},
) {
  const queryKey = getTransfersByIdQueryKey({ id })
  return queryOptions<
    ResponseConfig<GetTransfersByIdQueryResponse>,
    ResponseErrorConfig<GetTransfersById400 | GetTransfersById401 | GetTransfersById403 | GetTransfersById500>,
    ResponseConfig<GetTransfersByIdQueryResponse>,
    typeof queryKey
  >({
    enabled: !!id,
    queryKey,
    queryFn: async ({ signal }) => {
      config.signal = signal
      return getTransfersById({ id }, config)
    },
  })
}

/**
 * @description This endpoint gets a transfer by ID.Currently, the API can only return transfers for the following payment rails:- ACH- DOMESTIC_WIRE- CHEQUE- INTERNATIONAL_WIRE
 * @summary Get transfer
 * {@link /v1/transfers/:id}
 */
export function useGetTransfersById<
  TData = ResponseConfig<GetTransfersByIdQueryResponse>,
  TQueryData = ResponseConfig<GetTransfersByIdQueryResponse>,
  TQueryKey extends QueryKey = GetTransfersByIdQueryKey,
>(
  { id }: { id: GetTransfersByIdPathParams['id'] },
  options: {
    query?: Partial<
      QueryObserverOptions<
        ResponseConfig<GetTransfersByIdQueryResponse>,
        ResponseErrorConfig<GetTransfersById400 | GetTransfersById401 | GetTransfersById403 | GetTransfersById500>,
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
  const queryKey = queryOptions?.queryKey ?? getTransfersByIdQueryKey({ id })

  const query = useQuery(
    {
      ...getTransfersByIdQueryOptions({ id }, config),
      queryKey,
      ...queryOptions,
    } as unknown as QueryObserverOptions,
    queryClient,
  ) as UseQueryResult<TData, ResponseErrorConfig<GetTransfersById400 | GetTransfersById401 | GetTransfersById403 | GetTransfersById500>> & {
    queryKey: TQueryKey
  }

  query.queryKey = queryKey as TQueryKey

  return query
}
