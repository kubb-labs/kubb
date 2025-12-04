import useSWR from 'swr'
import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  ListTransfers400,
  ListTransfers401,
  ListTransfers403,
  ListTransfers500,
  ListTransfersQueryParams,
  ListTransfersQueryResponse,
} from '../../../models/ts/transfersController/ListTransfers.ts'
import { listTransfers } from '../../axios/TransfersService/listTransfers.ts'

export const listTransfersQueryKeySWR = (params?: ListTransfersQueryParams) => [{ url: '/v1/transfers' }, ...(params ? [params] : [])] as const

export type ListTransfersQueryKeySWR = ReturnType<typeof listTransfersQueryKeySWR>

export function listTransfersQueryOptionsSWR(
  { params }: { params?: ListTransfersQueryParams },
  config: Partial<RequestConfig> & { client?: typeof fetch } = {},
) {
  return {
    fetcher: async () => {
      return listTransfers({ params }, config)
    },
  }
}

/**
 * @description This endpoint lists existing transfers for an account.Currently, the API can only return transfers for the following payment rails:- ACH- DOMESTIC_WIRE- CHEQUE- INTERNATIONAL_WIRE
 * @summary Lists transfers
 * {@link /v1/transfers}
 */
export function useListTransfersSWR(
  { params }: { params?: ListTransfersQueryParams },
  options: {
    query?: Parameters<
      typeof useSWR<ResponseConfig<ListTransfersQueryResponse>, ResponseErrorConfig<ListTransfers400 | ListTransfers401 | ListTransfers403 | ListTransfers500>>
    >[2]
    client?: Partial<RequestConfig> & { client?: typeof fetch }
    shouldFetch?: boolean
    immutable?: boolean
  } = {},
) {
  const { query: queryOptions, client: config = {}, shouldFetch = true, immutable } = options ?? {}

  const queryKey = listTransfersQueryKeySWR(params)

  return useSWR<
    ResponseConfig<ListTransfersQueryResponse>,
    ResponseErrorConfig<ListTransfers400 | ListTransfers401 | ListTransfers403 | ListTransfers500>,
    ListTransfersQueryKeySWR | null
  >(shouldFetch ? queryKey : null, {
    ...listTransfersQueryOptionsSWR({ params }, config),
    ...(immutable
      ? {
          revalidateIfStale: false,
          revalidateOnFocus: false,
          revalidateOnReconnect: false,
        }
      : {}),
    ...queryOptions,
  })
}
