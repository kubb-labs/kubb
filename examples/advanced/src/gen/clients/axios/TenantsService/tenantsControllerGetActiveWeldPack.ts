import fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  TenantsControllerGetActiveWeldPackQueryResponse,
  TenantsControllerGetActiveWeldPackPathParams,
} from '../../../models/ts/tenantsController/TenantsControllerGetActiveWeldPack.ts'
import { tenantsControllerGetActiveWeldPackQueryResponseSchema } from '../../../zod/tenantsController/tenantsControllerGetActiveWeldPackSchema.ts'

export function getTenantsControllerGetActiveWeldPackUrl({ id }: { id: TenantsControllerGetActiveWeldPackPathParams['id'] }) {
  const res = { method: 'GET', url: `https://petstore3.swagger.io/api/v3/api/tenants/${id}/active-weldpack` as const }
  return res
}

/**
 * {@link /api/tenants/:id/active-weldpack}
 */
export async function tenantsControllerGetActiveWeldPack(
  { id }: { id: TenantsControllerGetActiveWeldPackPathParams['id'] },
  config: Partial<RequestConfig> & { client?: typeof fetch } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<TenantsControllerGetActiveWeldPackQueryResponse, ResponseErrorConfig<Error>, unknown>({
    method: 'GET',
    url: getTenantsControllerGetActiveWeldPackUrl({ id }).url.toString(),
    ...requestConfig,
  })
  return { ...res, data: tenantsControllerGetActiveWeldPackQueryResponseSchema.parse(res.data) }
}
