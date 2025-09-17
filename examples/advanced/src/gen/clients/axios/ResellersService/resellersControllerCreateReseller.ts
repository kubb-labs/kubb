import fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  ResellersControllerCreateResellerMutationRequest,
  ResellersControllerCreateResellerMutationResponse,
} from '../../../models/ts/resellersController/ResellersControllerCreateReseller.ts'
import {
  resellersControllerCreateResellerMutationResponseSchema,
  resellersControllerCreateResellerMutationRequestSchema,
} from '../../../zod/resellersController/resellersControllerCreateResellerSchema.ts'

export function getResellersControllerCreateResellerUrl() {
  const res = { method: 'POST', url: 'https://petstore3.swagger.io/api/v3/api/resellers' as const }
  return res
}

/**
 * {@link /api/resellers}
 */
export async function resellersControllerCreateReseller(
  { data }: { data: ResellersControllerCreateResellerMutationRequest },
  config: Partial<RequestConfig<ResellersControllerCreateResellerMutationRequest>> & { client?: typeof fetch } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const requestData = resellersControllerCreateResellerMutationRequestSchema.parse(data)

  const res = await request<ResellersControllerCreateResellerMutationResponse, ResponseErrorConfig<Error>, ResellersControllerCreateResellerMutationRequest>({
    method: 'POST',
    url: getResellersControllerCreateResellerUrl().url.toString(),
    data: requestData,
    ...requestConfig,
  })
  return { ...res, data: resellersControllerCreateResellerMutationResponseSchema.parse(res.data) }
}
