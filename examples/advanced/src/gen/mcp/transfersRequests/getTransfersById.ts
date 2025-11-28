import fetch from '@kubb/plugin-client/clients/axios'
import type {
  GetTransfersByIdQueryResponse,
  GetTransfersByIdPathParams,
  GetTransfersById400,
  GetTransfersById401,
  GetTransfersById403,
  GetTransfersById500,
} from '../../models/ts/transfersController/GetTransfersById.ts'
import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * @description This endpoint gets a transfer by ID.Currently, the API can only return transfers for the following payment rails:- ACH- DOMESTIC_WIRE- CHEQUE- INTERNATIONAL_WIRE
 * @summary Get transfer
 * {@link /v1/transfers/:id}
 */
export async function getTransfersByIdHandler({ id }: { id: GetTransfersByIdPathParams['id'] }): Promise<Promise<CallToolResult>> {
  const res = await fetch<
    GetTransfersByIdQueryResponse,
    ResponseErrorConfig<GetTransfersById400 | GetTransfersById401 | GetTransfersById403 | GetTransfersById500>,
    unknown
  >({ method: 'GET', url: `/v1/transfers/${id}`, baseURL: 'https://petstore.swagger.io/v2' })
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(res.data),
      },
    ],
  }
}
