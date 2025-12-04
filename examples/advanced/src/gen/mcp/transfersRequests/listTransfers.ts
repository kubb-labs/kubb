import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import fetch from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import type {
  ListTransfers400,
  ListTransfers401,
  ListTransfers403,
  ListTransfers500,
  ListTransfersQueryParams,
  ListTransfersQueryResponse,
} from '../../models/ts/transfersController/ListTransfers.ts'

/**
 * @description This endpoint lists existing transfers for an account.Currently, the API can only return transfers for the following payment rails:- ACH- DOMESTIC_WIRE- CHEQUE- INTERNATIONAL_WIRE
 * @summary Lists transfers
 * {@link /v1/transfers}
 */
export async function listTransfersHandler({ params }: { params?: ListTransfersQueryParams }): Promise<Promise<CallToolResult>> {
  const res = await fetch<ListTransfersQueryResponse, ResponseErrorConfig<ListTransfers400 | ListTransfers401 | ListTransfers403 | ListTransfers500>, unknown>({
    method: 'GET',
    url: '/v1/transfers',
    baseURL: 'https://petstore.swagger.io/v2',
    params,
  })
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(res.data),
      },
    ],
  }
}
