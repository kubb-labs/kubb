import fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  PartsControllerDownloadPartMutationRequest,
  PartsControllerDownloadPartMutationResponse,
  PartsControllerDownloadPartPathParams,
} from '../../../models/ts/partsController/PartsControllerDownloadPart.ts'
import {
  partsControllerDownloadPartMutationResponseSchema,
  partsControllerDownloadPartMutationRequestSchema,
} from '../../../zod/partsController/partsControllerDownloadPartSchema.ts'

export function getPartsControllerDownloadPartUrl({ urn }: { urn: PartsControllerDownloadPartPathParams['urn'] }) {
  const res = { method: 'POST', url: `https://petstore3.swagger.io/api/v3/api/parts/${urn}/download` as const }
  return res
}

/**
 * {@link /api/parts/:urn/download}
 */
export async function partsControllerDownloadPart(
  { urn, data }: { urn: PartsControllerDownloadPartPathParams['urn']; data: PartsControllerDownloadPartMutationRequest },
  config: Partial<RequestConfig<PartsControllerDownloadPartMutationRequest>> & { client?: typeof fetch } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const requestData = partsControllerDownloadPartMutationRequestSchema.parse(data)

  const res = await request<PartsControllerDownloadPartMutationResponse, ResponseErrorConfig<Error>, PartsControllerDownloadPartMutationRequest>({
    method: 'POST',
    url: getPartsControllerDownloadPartUrl({ urn }).url.toString(),
    data: requestData,
    ...requestConfig,
  })
  return { ...res, data: partsControllerDownloadPartMutationResponseSchema.parse(res.data) }
}
