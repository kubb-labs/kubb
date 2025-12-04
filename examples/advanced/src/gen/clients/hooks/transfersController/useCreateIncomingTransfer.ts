import type { QueryClient, UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import { mutationOptions, useMutation } from '@tanstack/react-query'
import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  CreateIncomingTransferHeaderParams,
  CreateIncomingTransferMutationRequest,
  CreateIncomingTransferMutationResponse,
} from '../../../models/ts/transfersController/CreateIncomingTransfer.ts'
import { createIncomingTransfer } from '../../axios/TransfersService/createIncomingTransfer.ts'

export const createIncomingTransferMutationKey = () => [{ url: '/v1/incoming_transfers' }] as const

export type CreateIncomingTransferMutationKey = ReturnType<typeof createIncomingTransferMutationKey>

export function createIncomingTransferMutationOptions(config: Partial<RequestConfig<CreateIncomingTransferMutationRequest>> & { client?: typeof fetch } = {}) {
  const mutationKey = createIncomingTransferMutationKey()
  return mutationOptions<
    ResponseConfig<CreateIncomingTransferMutationResponse>,
    ResponseErrorConfig<Error>,
    { data: CreateIncomingTransferMutationRequest; headers: CreateIncomingTransferHeaderParams },
    typeof mutationKey
  >({
    mutationKey,
    mutationFn: async ({ data, headers }) => {
      return createIncomingTransfer({ data, headers }, config)
    },
  })
}

/**
 * @description This endpoint creates a new incoming transfer. You may use use any eligible bank account connection to fund (ACH Debit) any active Brex business account.**Reminder**: You may not use the Brex API for any activity that requires a license or registration from any governmental authority without Brex's prior review and approval. This includes but is not limited to any money servicesbusiness or money transmission activity.Please review the <a href="https://www.brex.com/legal/developer-portal/">Brex Access Agreement</a> and contact us if you have any questions.
 * @summary Create incoming transfer
 * {@link /v1/incoming_transfers}
 */
export function useCreateIncomingTransfer<TContext>(
  options: {
    mutation?: UseMutationOptions<
      ResponseConfig<CreateIncomingTransferMutationResponse>,
      ResponseErrorConfig<Error>,
      { data: CreateIncomingTransferMutationRequest; headers: CreateIncomingTransferHeaderParams },
      TContext
    > & { client?: QueryClient }
    client?: Partial<RequestConfig<CreateIncomingTransferMutationRequest>> & { client?: typeof fetch }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? createIncomingTransferMutationKey()

  const baseOptions = createIncomingTransferMutationOptions(config) as UseMutationOptions<
    ResponseConfig<CreateIncomingTransferMutationResponse>,
    ResponseErrorConfig<Error>,
    { data: CreateIncomingTransferMutationRequest; headers: CreateIncomingTransferHeaderParams },
    TContext
  >

  return useMutation<
    ResponseConfig<CreateIncomingTransferMutationResponse>,
    ResponseErrorConfig<Error>,
    { data: CreateIncomingTransferMutationRequest; headers: CreateIncomingTransferHeaderParams },
    TContext
  >(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<
    ResponseConfig<CreateIncomingTransferMutationResponse>,
    ResponseErrorConfig<Error>,
    { data: CreateIncomingTransferMutationRequest; headers: CreateIncomingTransferHeaderParams },
    TContext
  >
}
