import type fetch from '../../../../axios-client.ts'
import useSWRMutation from 'swr/mutation'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type {
  CreateTransferMutationRequest,
  CreateTransferMutationResponse,
  CreateTransferHeaderParams,
} from '../../../models/ts/transfersController/CreateTransfer.ts'
import type { SWRMutationConfiguration } from 'swr/mutation'
import { createTransfer } from '../../axios/TransfersService/createTransfer.ts'

export const createTransferMutationKeySWR = () => [{ url: '/v1/transfers' }] as const

export type CreateTransferMutationKeySWR = ReturnType<typeof createTransferMutationKeySWR>

/**
 * @description This endpoint creates a new transfer.Currently, the API can only create transfers for the following payment rails:- ACH- DOMESTIC_WIRE- CHEQUE- INTERNATIONAL_WIRES**Transaction Descriptions*** For outgoing check payments, a successful transfer will return a response containing a description value with a format of `Check #<check number> to <recipient_name> - <external_memo>`.* For book transfers (from one Brex Business account to another), the recipient value will have a format of `<customer_account.dba_name> - <external_memo>` and the sender will have a format of `<target customer account's dba name> - <external_memo>`.* For other payment rails, the format will be `<counterparty_name> - <external_memo>`, where Counterparty name is `payment_instrument.beneficiary_name` or `contact.name`For vendors created from the Payments API, the `counterparty_name` will be the `company_name` [field](/openapi/payments_api/#operation/createVendor!path=company_name&t=request).**Reminder**: You may not use the Brex API for any activity that requires a license or registration from any governmental authority without Brex's prior review and approval. This includes but is not limited to any money servicesbusiness or money transmission activity.Please review the <a href="https://www.brex.com/legal/developer-portal/">Brex Access Agreement</a> and contact us if you have any questions.
 * @summary Create transfer
 * {@link /v1/transfers}
 */
export function useCreateTransferSWR(
  headers: CreateTransferHeaderParams,
  options: {
    mutation?: SWRMutationConfiguration<
      ResponseConfig<CreateTransferMutationResponse>,
      ResponseErrorConfig<Error>,
      CreateTransferMutationKeySWR | null,
      CreateTransferMutationRequest
    > & { throwOnError?: boolean }
    client?: Partial<RequestConfig<CreateTransferMutationRequest>> & { client?: typeof fetch }
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = createTransferMutationKeySWR()

  return useSWRMutation<
    ResponseConfig<CreateTransferMutationResponse>,
    ResponseErrorConfig<Error>,
    CreateTransferMutationKeySWR | null,
    CreateTransferMutationRequest
  >(
    shouldFetch ? mutationKey : null,
    async (_url, { arg: data }) => {
      return createTransfer({ data, headers }, config)
    },
    mutationOptions,
  )
}
