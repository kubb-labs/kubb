import type fetch from '../../../../axios-client.ts'
import useSWR from 'swr'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type {
  GetTransfersByIdQueryResponse,
  GetTransfersByIdPathParams,
  GetTransfersById400,
  GetTransfersById401,
  GetTransfersById403,
  GetTransfersById500,
} from '../../../models/ts/transfersController/GetTransfersById.ts'
import { getTransfersById } from '../../axios/TransfersService/getTransfersById.ts'

export const getTransfersByIdQueryKeySWR = ({ id }: { id: GetTransfersByIdPathParams['id'] }) => [{ url: '/v1/transfers/:id', params: { id: id } }] as const

export type GetTransfersByIdQueryKeySWR = ReturnType<typeof getTransfersByIdQueryKeySWR>

export function getTransfersByIdQueryOptionsSWR(
  { id }: { id: GetTransfersByIdPathParams['id'] },
  config: Partial<RequestConfig> & { client?: typeof fetch } = {},
) {
  return {
    fetcher: async () => {
      return getTransfersById({ id }, config)
    },
  }
}

/**
 * @description This endpoint gets a transfer by ID.Currently, the API can only return transfers for the following payment rails:- ACH- DOMESTIC_WIRE- CHEQUE- INTERNATIONAL_WIRE
 * @summary Get transfer
 * {@link /v1/transfers/:id}
 */
export function useGetTransfersByIdSWR(
  { id }: { id: GetTransfersByIdPathParams['id'] },
  options: {
    query?: Parameters<
      typeof useSWR<
        ResponseConfig<GetTransfersByIdQueryResponse>,
        ResponseErrorConfig<GetTransfersById400 | GetTransfersById401 | GetTransfersById403 | GetTransfersById500>
      >
    >[2]
    client?: Partial<RequestConfig> & { client?: typeof fetch }
    shouldFetch?: boolean
    immutable?: boolean
  } = {},
) {
  const { query: queryOptions, client: config = {}, shouldFetch = true, immutable } = options ?? {}

  const queryKey = getTransfersByIdQueryKeySWR({ id })

  return useSWR<
    ResponseConfig<GetTransfersByIdQueryResponse>,
    ResponseErrorConfig<GetTransfersById400 | GetTransfersById401 | GetTransfersById403 | GetTransfersById500>,
    GetTransfersByIdQueryKeySWR | null
  >(shouldFetch ? queryKey : null, {
    ...getTransfersByIdQueryOptionsSWR({ id }, config),
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
