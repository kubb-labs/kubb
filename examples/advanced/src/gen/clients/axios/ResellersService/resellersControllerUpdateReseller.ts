import fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  ResellersControllerUpdateResellerMutationRequest,
  ResellersControllerUpdateResellerMutationResponse,
  ResellersControllerUpdateResellerPathParams,
} from '../../../models/ts/resellersController/ResellersControllerUpdateReseller.ts'
import {
  resellersControllerUpdateResellerMutationResponseSchema,
  resellersControllerUpdateResellerMutationRequestSchema,
} from '../../../zod/resellersController/resellersControllerUpdateResellerSchema.ts'

export function getResellersControllerUpdateResellerUrl({ id }: { id: ResellersControllerUpdateResellerPathParams['id'] }) {
  const res = { method: 'PATCH', url: `https://petstore3.swagger.io/api/v3/api/resellers/${id}` as const }
  return res
}

/**
 * {@link /api/resellers/:id}
 */
export async function resellersControllerUpdateReseller(
  { id, data }: { id: ResellersControllerUpdateResellerPathParams['id']; data: ResellersControllerUpdateResellerMutationRequest },
  config: Partial<RequestConfig<ResellersControllerUpdateResellerMutationRequest>> & { client?: typeof fetch } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const requestData = resellersControllerUpdateResellerMutationRequestSchema.parse(data)

  const res = await request<ResellersControllerUpdateResellerMutationResponse, ResponseErrorConfig<Error>, ResellersControllerUpdateResellerMutationRequest>({
    method: 'PATCH',
    url: getResellersControllerUpdateResellerUrl({ id }).url.toString(),
    data: requestData,
    ...requestConfig,
  })
  return { ...res, data: resellersControllerUpdateResellerMutationResponseSchema.parse(res.data) }
}
