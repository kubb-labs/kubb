import fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  TenantsControllerGetWeldCreditsQueryResponse,
  TenantsControllerGetWeldCreditsPathParams,
} from '../../../models/ts/tenantsController/TenantsControllerGetWeldCredits.ts'
import { tenantsControllerGetWeldCreditsQueryResponseSchema } from '../../../zod/tenantsController/tenantsControllerGetWeldCreditsSchema.ts'

export function getTenantsControllerGetWeldCreditsUrl({ id }: { id: TenantsControllerGetWeldCreditsPathParams['id'] }) {
  const res = { method: 'GET', url: `https://petstore3.swagger.io/api/v3/api/tenants/${id}/weld-credits` as const }
  return res
}

/**
 * {@link /api/tenants/:id/weld-credits}
 */
export async function tenantsControllerGetWeldCredits(
  { id }: { id: TenantsControllerGetWeldCreditsPathParams['id'] },
  config: Partial<RequestConfig> & { client?: typeof fetch } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<TenantsControllerGetWeldCreditsQueryResponse, ResponseErrorConfig<Error>, unknown>({
    method: 'GET',
    url: getTenantsControllerGetWeldCreditsUrl({ id }).url.toString(),
    ...requestConfig,
  })
  return { ...res, data: tenantsControllerGetWeldCreditsQueryResponseSchema.parse(res.data) }
}
