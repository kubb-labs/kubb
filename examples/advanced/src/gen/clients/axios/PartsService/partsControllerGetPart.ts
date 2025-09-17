import fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { PartsControllerGetPartQueryResponse, PartsControllerGetPartPathParams } from '../../../models/ts/partsController/PartsControllerGetPart.ts'
import { partsControllerGetPartQueryResponseSchema } from '../../../zod/partsController/partsControllerGetPartSchema.ts'

export function getPartsControllerGetPartUrl({ urn }: { urn: PartsControllerGetPartPathParams['urn'] }) {
  const res = { method: 'GET', url: `https://petstore3.swagger.io/api/v3/api/parts/${urn}` as const }
  return res
}

/**
 * {@link /api/parts/:urn}
 */
export async function partsControllerGetPart(
  { urn }: { urn: PartsControllerGetPartPathParams['urn'] },
  config: Partial<RequestConfig> & { client?: typeof fetch } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<PartsControllerGetPartQueryResponse, ResponseErrorConfig<Error>, unknown>({
    method: 'GET',
    url: getPartsControllerGetPartUrl({ urn }).url.toString(),
    ...requestConfig,
  })
  return { ...res, data: partsControllerGetPartQueryResponseSchema.parse(res.data) }
}
