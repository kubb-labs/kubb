import fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  CreateIncomingTransferMutationRequest,
  CreateIncomingTransferMutationResponse,
  CreateIncomingTransferHeaderParams,
} from '../../../models/ts/transfersController/CreateIncomingTransfer.ts'
import {
  createIncomingTransferMutationResponseSchema,
  createIncomingTransferMutationRequestSchema,
} from '../../../zod/transfersController/createIncomingTransferSchema.ts'

export function getCreateIncomingTransferUrl() {
  const res = { method: 'POST', url: 'https://petstore3.swagger.io/api/v3/v1/incoming_transfers' as const }
  return res
}

/**
 * @description This endpoint creates a new incoming transfer. You may use use any eligible bank account connection to fund (ACH Debit) any active Brex business account.**Reminder**: You may not use the Brex API for any activity that requires a license or registration from any governmental authority without Brex's prior review and approval. This includes but is not limited to any money servicesbusiness or money transmission activity.Please review the <a href="https://www.brex.com/legal/developer-portal/">Brex Access Agreement</a> and contact us if you have any questions.
 * @summary Create incoming transfer
 * {@link /v1/incoming_transfers}
 */
export async function createIncomingTransfer(
  { data, headers }: { data: CreateIncomingTransferMutationRequest; headers: CreateIncomingTransferHeaderParams },
  config: Partial<RequestConfig<CreateIncomingTransferMutationRequest>> & { client?: typeof fetch } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const requestData = createIncomingTransferMutationRequestSchema.parse(data)

  const res = await request<CreateIncomingTransferMutationResponse, ResponseErrorConfig<Error>, CreateIncomingTransferMutationRequest>({
    method: 'POST',
    url: getCreateIncomingTransferUrl().url.toString(),
    data: requestData,
    ...requestConfig,
    headers: { ...headers, ...requestConfig.headers },
  })
  return { ...res, data: createIncomingTransferMutationResponseSchema.parse(res.data) }
}
