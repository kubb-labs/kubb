import fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  PartsControllerSimulatePartMutationRequest,
  PartsControllerSimulatePartMutationResponse,
  PartsControllerSimulatePartPathParams,
} from '../../../models/ts/partsController/PartsControllerSimulatePart.ts'
import {
  partsControllerSimulatePartMutationResponseSchema,
  partsControllerSimulatePartMutationRequestSchema,
} from '../../../zod/partsController/partsControllerSimulatePartSchema.ts'

export function getPartsControllerSimulatePartUrl({ urn }: { urn: PartsControllerSimulatePartPathParams['urn'] }) {
  const res = { method: 'POST', url: `https://petstore3.swagger.io/api/v3/api/parts/${urn}/simulate` as const }
  return res
}

/**
 * {@link /api/parts/:urn/simulate}
 */
export async function partsControllerSimulatePart(
  { urn, data }: { urn: PartsControllerSimulatePartPathParams['urn']; data: PartsControllerSimulatePartMutationRequest },
  config: Partial<RequestConfig<PartsControllerSimulatePartMutationRequest>> & { client?: typeof fetch } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const requestData = partsControllerSimulatePartMutationRequestSchema.parse(data)

  const res = await request<PartsControllerSimulatePartMutationResponse, ResponseErrorConfig<Error>, PartsControllerSimulatePartMutationRequest>({
    method: 'POST',
    url: getPartsControllerSimulatePartUrl({ urn }).url.toString(),
    data: requestData,
    ...requestConfig,
  })
  return { ...res, data: partsControllerSimulatePartMutationResponseSchema.parse(res.data) }
}
