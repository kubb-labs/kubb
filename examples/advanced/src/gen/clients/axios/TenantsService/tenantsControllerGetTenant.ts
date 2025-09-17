import fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  TenantsControllerGetTenantQueryResponse,
  TenantsControllerGetTenantPathParams,
} from '../../../models/ts/tenantsController/TenantsControllerGetTenant.ts'
import { tenantsControllerGetTenantQueryResponseSchema } from '../../../zod/tenantsController/tenantsControllerGetTenantSchema.ts'

export function getTenantsControllerGetTenantUrl({ id }: { id: TenantsControllerGetTenantPathParams['id'] }) {
  const res = { method: 'GET', url: `https://petstore3.swagger.io/api/v3/api/tenants/${id}` as const }
  return res
}

/**
 * {@link /api/tenants/:id}
 */
export async function tenantsControllerGetTenant(
  { id }: { id: TenantsControllerGetTenantPathParams['id'] },
  config: Partial<RequestConfig> & { client?: typeof fetch } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<TenantsControllerGetTenantQueryResponse, ResponseErrorConfig<Error>, unknown>({
    method: 'GET',
    url: getTenantsControllerGetTenantUrl({ id }).url.toString(),
    ...requestConfig,
  })
  return { ...res, data: tenantsControllerGetTenantQueryResponseSchema.parse(res.data) }
}
