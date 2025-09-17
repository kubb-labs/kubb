import fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { ResellersControllerGetResellersQueryResponse } from '../../../models/ts/resellersController/ResellersControllerGetResellers.ts'
import { resellersControllerGetResellersQueryResponseSchema } from '../../../zod/resellersController/resellersControllerGetResellersSchema.ts'

export function getResellersControllerGetResellersUrl() {
  const res = { method: 'GET', url: 'https://petstore3.swagger.io/api/v3/api/resellers' as const }
  return res
}

/**
 * {@link /api/resellers}
 */
export async function resellersControllerGetResellers(config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<ResellersControllerGetResellersQueryResponse, ResponseErrorConfig<Error>, unknown>({
    method: 'GET',
    url: getResellersControllerGetResellersUrl().url.toString(),
    ...requestConfig,
  })
  return { ...res, data: resellersControllerGetResellersQueryResponseSchema.parse(res.data) }
}
