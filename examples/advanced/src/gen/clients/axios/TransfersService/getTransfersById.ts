import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import fetch from '../../../../axios-client.ts'
import type {
  GetTransfersById400,
  GetTransfersById401,
  GetTransfersById403,
  GetTransfersById500,
  GetTransfersByIdPathParams,
  GetTransfersByIdQueryResponse,
} from '../../../models/ts/transfersController/GetTransfersById.ts'
import { getTransfersByIdQueryResponseSchema } from '../../../zod/transfersController/getTransfersByIdSchema.ts'

export function getGetTransfersByIdUrl({ id }: { id: GetTransfersByIdPathParams['id'] }) {
  const res = { method: 'GET', url: `https://petstore3.swagger.io/api/v3/v1/transfers/${id}` as const }
  return res
}

/**
 * @description This endpoint gets a transfer by ID.Currently, the API can only return transfers for the following payment rails:- ACH- DOMESTIC_WIRE- CHEQUE- INTERNATIONAL_WIRE
 * @summary Get transfer
 * {@link /v1/transfers/:id}
 */
export async function getTransfersById({ id }: { id: GetTransfersByIdPathParams['id'] }, config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<
    GetTransfersByIdQueryResponse,
    ResponseErrorConfig<GetTransfersById400 | GetTransfersById401 | GetTransfersById403 | GetTransfersById500>,
    unknown
  >({ method: 'GET', url: getGetTransfersByIdUrl({ id }).url.toString(), ...requestConfig })
  return { ...res, data: getTransfersByIdQueryResponseSchema.parse(res.data) }
}
