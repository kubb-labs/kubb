import fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  ResellersControllerGetResellerQueryResponse,
  ResellersControllerGetResellerPathParams,
} from '../../../models/ts/resellersController/ResellersControllerGetReseller.ts'
import { resellersControllerGetResellerQueryResponseSchema } from '../../../zod/resellersController/resellersControllerGetResellerSchema.ts'

export function getResellersControllerGetResellerUrl({ id }: { id: ResellersControllerGetResellerPathParams['id'] }) {
  const res = { method: 'GET', url: `https://petstore3.swagger.io/api/v3/api/resellers/${id}` as const }
  return res
}

/**
 * {@link /api/resellers/:id}
 */
export async function resellersControllerGetReseller(
  { id }: { id: ResellersControllerGetResellerPathParams['id'] },
  config: Partial<RequestConfig> & { client?: typeof fetch } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<ResellersControllerGetResellerQueryResponse, ResponseErrorConfig<Error>, unknown>({
    method: 'GET',
    url: getResellersControllerGetResellerUrl({ id }).url.toString(),
    ...requestConfig,
  })
  return { ...res, data: resellersControllerGetResellerQueryResponseSchema.parse(res.data) }
}
