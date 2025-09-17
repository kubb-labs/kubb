import fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { TenantsControllerGetTenantsQueryResponse } from '../../../models/ts/tenantsController/TenantsControllerGetTenants.ts'
import { tenantsControllerGetTenantsQueryResponseSchema } from '../../../zod/tenantsController/tenantsControllerGetTenantsSchema.ts'

export function getTenantsControllerGetTenantsUrl() {
  const res = { method: 'GET', url: 'https://petstore3.swagger.io/api/v3/api/tenants' as const }
  return res
}

/**
 * {@link /api/tenants}
 */
export async function tenantsControllerGetTenants(config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<TenantsControllerGetTenantsQueryResponse, ResponseErrorConfig<Error>, unknown>({
    method: 'GET',
    url: getTenantsControllerGetTenantsUrl().url.toString(),
    ...requestConfig,
  })
  return { ...res, data: tenantsControllerGetTenantsQueryResponseSchema.parse(res.data) }
}
