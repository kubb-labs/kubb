import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import fetch from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import type {
  CreateIncomingTransferHeaderParams,
  CreateIncomingTransferMutationRequest,
  CreateIncomingTransferMutationResponse,
} from '../../models/ts/transfersController/CreateIncomingTransfer.ts'

/**
 * @description This endpoint creates a new incoming transfer. You may use use any eligible bank account connection to fund (ACH Debit) any active Brex business account.**Reminder**: You may not use the Brex API for any activity that requires a license or registration from any governmental authority without Brex's prior review and approval. This includes but is not limited to any money servicesbusiness or money transmission activity.Please review the <a href="https://www.brex.com/legal/developer-portal/">Brex Access Agreement</a> and contact us if you have any questions.
 * @summary Create incoming transfer
 * {@link /v1/incoming_transfers}
 */
export async function createIncomingTransferHandler({
  data,
  headers,
}: {
  data: CreateIncomingTransferMutationRequest
  headers: CreateIncomingTransferHeaderParams
}): Promise<Promise<CallToolResult>> {
  const requestData = data

  const res = await fetch<CreateIncomingTransferMutationResponse, ResponseErrorConfig<Error>, CreateIncomingTransferMutationRequest>({
    method: 'POST',
    url: '/v1/incoming_transfers',
    baseURL: 'https://petstore.swagger.io/v2',
    data: requestData,
    headers: { ...headers },
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
