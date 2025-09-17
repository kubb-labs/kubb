import fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  TenantsControllerCreateTenantMutationRequest,
  TenantsControllerCreateTenantMutationResponse,
} from '../../../models/ts/tenantsController/TenantsControllerCreateTenant.ts'
import {
  tenantsControllerCreateTenantMutationResponseSchema,
  tenantsControllerCreateTenantMutationRequestSchema,
} from '../../../zod/tenantsController/tenantsControllerCreateTenantSchema.ts'

export function getTenantsControllerCreateTenantUrl() {
  const res = { method: 'POST', url: 'https://petstore3.swagger.io/api/v3/api/tenants' as const }
  return res
}

/**
 * {@link /api/tenants}
 */
export async function tenantsControllerCreateTenant(
  { data }: { data: TenantsControllerCreateTenantMutationRequest },
  config: Partial<RequestConfig<TenantsControllerCreateTenantMutationRequest>> & { client?: typeof fetch } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const requestData = tenantsControllerCreateTenantMutationRequestSchema.parse(data)

  const res = await request<TenantsControllerCreateTenantMutationResponse, ResponseErrorConfig<Error>, TenantsControllerCreateTenantMutationRequest>({
    method: 'POST',
    url: getTenantsControllerCreateTenantUrl().url.toString(),
    data: requestData,
    ...requestConfig,
  })
  return { ...res, data: tenantsControllerCreateTenantMutationResponseSchema.parse(res.data) }
}
