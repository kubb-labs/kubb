import type { QueryClient, UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import { mutationOptions, useMutation } from '@tanstack/react-query'
import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  CreateTransferHeaderParams,
  CreateTransferMutationRequest,
  CreateTransferMutationResponse,
} from '../../../models/ts/transfersController/CreateTransfer.ts'
import { createTransfer } from '../../axios/TransfersService/createTransfer.ts'

export const createTransferMutationKey = () => [{ url: '/v1/transfers' }] as const

export type CreateTransferMutationKey = ReturnType<typeof createTransferMutationKey>

export function createTransferMutationOptions(config: Partial<RequestConfig<CreateTransferMutationRequest>> & { client?: typeof fetch } = {}) {
  const mutationKey = createTransferMutationKey()
  return mutationOptions<
    ResponseConfig<CreateTransferMutationResponse>,
    ResponseErrorConfig<Error>,
    { data: CreateTransferMutationRequest; headers: CreateTransferHeaderParams },
    typeof mutationKey
  >({
    mutationKey,
    mutationFn: async ({ data, headers }) => {
      return createTransfer({ data, headers }, config)
    },
  })
}

/**
 * @description This endpoint creates a new transfer.Currently, the API can only create transfers for the following payment rails:- ACH- DOMESTIC_WIRE- CHEQUE- INTERNATIONAL_WIRES**Transaction Descriptions*** For outgoing check payments, a successful transfer will return a response containing a description value with a format of `Check #<check number> to <recipient_name> - <external_memo>`.* For book transfers (from one Brex Business account to another), the recipient value will have a format of `<customer_account.dba_name> - <external_memo>` and the sender will have a format of `<target customer account's dba name> - <external_memo>`.* For other payment rails, the format will be `<counterparty_name> - <external_memo>`, where Counterparty name is `payment_instrument.beneficiary_name` or `contact.name`For vendors created from the Payments API, the `counterparty_name` will be the `company_name` [field](/openapi/payments_api/#operation/createVendor!path=company_name&t=request).**Reminder**: You may not use the Brex API for any activity that requires a license or registration from any governmental authority without Brex's prior review and approval. This includes but is not limited to any money servicesbusiness or money transmission activity.Please review the <a href="https://www.brex.com/legal/developer-portal/">Brex Access Agreement</a> and contact us if you have any questions.
 * @summary Create transfer
 * {@link /v1/transfers}
 */
export function useCreateTransfer<TContext>(
  options: {
    mutation?: UseMutationOptions<
      ResponseConfig<CreateTransferMutationResponse>,
      ResponseErrorConfig<Error>,
      { data: CreateTransferMutationRequest; headers: CreateTransferHeaderParams },
      TContext
    > & { client?: QueryClient }
    client?: Partial<RequestConfig<CreateTransferMutationRequest>> & { client?: typeof fetch }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? createTransferMutationKey()

  const baseOptions = createTransferMutationOptions(config) as UseMutationOptions<
    ResponseConfig<CreateTransferMutationResponse>,
    ResponseErrorConfig<Error>,
    { data: CreateTransferMutationRequest; headers: CreateTransferHeaderParams },
    TContext
  >

  return useMutation<
    ResponseConfig<CreateTransferMutationResponse>,
    ResponseErrorConfig<Error>,
    { data: CreateTransferMutationRequest; headers: CreateTransferHeaderParams },
    TContext
  >(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<
    ResponseConfig<CreateTransferMutationResponse>,
    ResponseErrorConfig<Error>,
    { data: CreateTransferMutationRequest; headers: CreateTransferHeaderParams },
    TContext
  >
}
