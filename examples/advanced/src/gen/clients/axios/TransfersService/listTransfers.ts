import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import fetch from '../../../../axios-client.ts'
import type {
  ListTransfers400,
  ListTransfers401,
  ListTransfers403,
  ListTransfers500,
  ListTransfersQueryParams,
  ListTransfersQueryResponse,
} from '../../../models/ts/transfersController/ListTransfers.ts'
import { listTransfersQueryResponseSchema } from '../../../zod/transfersController/listTransfersSchema.ts'

export function getListTransfersUrl() {
  const res = { method: 'GET', url: 'https://petstore3.swagger.io/api/v3/v1/transfers' as const }
  return res
}

/**
 * @description This endpoint lists existing transfers for an account.Currently, the API can only return transfers for the following payment rails:- ACH- DOMESTIC_WIRE- CHEQUE- INTERNATIONAL_WIRE
 * @summary Lists transfers
 * {@link /v1/transfers}
 */
export async function listTransfers({ params }: { params?: ListTransfersQueryParams }, config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<
    ListTransfersQueryResponse,
    ResponseErrorConfig<ListTransfers400 | ListTransfers401 | ListTransfers403 | ListTransfers500>,
    unknown
  >({ method: 'GET', url: getListTransfersUrl().url.toString(), params, ...requestConfig })
  return { ...res, data: listTransfersQueryResponseSchema.parse(res.data) }
}
