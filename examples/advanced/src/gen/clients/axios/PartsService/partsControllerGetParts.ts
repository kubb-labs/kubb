import fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { PartsControllerGetPartsQueryResponse } from '../../../models/ts/partsController/PartsControllerGetParts.ts'
import { partsControllerGetPartsQueryResponseSchema } from '../../../zod/partsController/partsControllerGetPartsSchema.ts'

export function getPartsControllerGetPartsUrl() {
  const res = { method: 'GET', url: 'https://petstore3.swagger.io/api/v3/api/parts' as const }
  return res
}

/**
 * {@link /api/parts}
 */
export async function partsControllerGetParts(config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<PartsControllerGetPartsQueryResponse, ResponseErrorConfig<Error>, unknown>({
    method: 'GET',
    url: getPartsControllerGetPartsUrl().url.toString(),
    ...requestConfig,
  })
  return { ...res, data: partsControllerGetPartsQueryResponseSchema.parse(res.data) }
}
