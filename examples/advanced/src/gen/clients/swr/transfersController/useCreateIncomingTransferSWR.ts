import type fetch from '../../../../axios-client.ts'
import useSWRMutation from 'swr/mutation'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type {
  CreateIncomingTransferMutationRequest,
  CreateIncomingTransferMutationResponse,
  CreateIncomingTransferHeaderParams,
} from '../../../models/ts/transfersController/CreateIncomingTransfer.ts'
import type { SWRMutationConfiguration } from 'swr/mutation'
import { createIncomingTransfer } from '../../axios/TransfersService/createIncomingTransfer.ts'

export const createIncomingTransferMutationKeySWR = () => [{ url: '/v1/incoming_transfers' }] as const

export type CreateIncomingTransferMutationKeySWR = ReturnType<typeof createIncomingTransferMutationKeySWR>

/**
 * @description This endpoint creates a new incoming transfer. You may use use any eligible bank account connection to fund (ACH Debit) any active Brex business account.**Reminder**: You may not use the Brex API for any activity that requires a license or registration from any governmental authority without Brex's prior review and approval. This includes but is not limited to any money servicesbusiness or money transmission activity.Please review the <a href="https://www.brex.com/legal/developer-portal/">Brex Access Agreement</a> and contact us if you have any questions.
 * @summary Create incoming transfer
 * {@link /v1/incoming_transfers}
 */
export function useCreateIncomingTransferSWR(
  headers: CreateIncomingTransferHeaderParams,
  options: {
    mutation?: SWRMutationConfiguration<
      ResponseConfig<CreateIncomingTransferMutationResponse>,
      ResponseErrorConfig<Error>,
      CreateIncomingTransferMutationKeySWR | null,
      CreateIncomingTransferMutationRequest
    > & { throwOnError?: boolean }
    client?: Partial<RequestConfig<CreateIncomingTransferMutationRequest>> & { client?: typeof fetch }
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = createIncomingTransferMutationKeySWR()

  return useSWRMutation<
    ResponseConfig<CreateIncomingTransferMutationResponse>,
    ResponseErrorConfig<Error>,
    CreateIncomingTransferMutationKeySWR | null,
    CreateIncomingTransferMutationRequest
  >(
    shouldFetch ? mutationKey : null,
    async (_url, { arg: data }) => {
      return createIncomingTransfer({ data, headers }, config)
    },
    mutationOptions,
  )
}
