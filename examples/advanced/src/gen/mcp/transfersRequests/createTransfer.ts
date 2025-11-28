import fetch from '@kubb/plugin-client/clients/axios'
import type {
  CreateTransferMutationRequest,
  CreateTransferMutationResponse,
  CreateTransferHeaderParams,
} from '../../models/ts/transfersController/CreateTransfer.ts'
import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * @description This endpoint creates a new transfer.Currently, the API can only create transfers for the following payment rails:- ACH- DOMESTIC_WIRE- CHEQUE- INTERNATIONAL_WIRES**Transaction Descriptions*** For outgoing check payments, a successful transfer will return a response containing a description value with a format of `Check #<check number> to <recipient_name> - <external_memo>`.* For book transfers (from one Brex Business account to another), the recipient value will have a format of `<customer_account.dba_name> - <external_memo>` and the sender will have a format of `<target customer account's dba name> - <external_memo>`.* For other payment rails, the format will be `<counterparty_name> - <external_memo>`, where Counterparty name is `payment_instrument.beneficiary_name` or `contact.name`For vendors created from the Payments API, the `counterparty_name` will be the `company_name` [field](/openapi/payments_api/#operation/createVendor!path=company_name&t=request).**Reminder**: You may not use the Brex API for any activity that requires a license or registration from any governmental authority without Brex's prior review and approval. This includes but is not limited to any money servicesbusiness or money transmission activity.Please review the <a href="https://www.brex.com/legal/developer-portal/">Brex Access Agreement</a> and contact us if you have any questions.
 * @summary Create transfer
 * {@link /v1/transfers}
 */
export async function createTransferHandler({
  data,
  headers,
}: {
  data: CreateTransferMutationRequest
  headers: CreateTransferHeaderParams
}): Promise<Promise<CallToolResult>> {
  const requestData = data

  const res = await fetch<CreateTransferMutationResponse, ResponseErrorConfig<Error>, CreateTransferMutationRequest>({
    method: 'POST',
    url: '/v1/transfers',
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
