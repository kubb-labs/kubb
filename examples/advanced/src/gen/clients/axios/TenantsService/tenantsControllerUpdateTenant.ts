import fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  TenantsControllerUpdateTenantMutationRequest,
  TenantsControllerUpdateTenantMutationResponse,
  TenantsControllerUpdateTenantPathParams,
} from '../../../models/ts/tenantsController/TenantsControllerUpdateTenant.ts'
import {
  tenantsControllerUpdateTenantMutationResponseSchema,
  tenantsControllerUpdateTenantMutationRequestSchema,
} from '../../../zod/tenantsController/tenantsControllerUpdateTenantSchema.ts'

export function getTenantsControllerUpdateTenantUrl({ id }: { id: TenantsControllerUpdateTenantPathParams['id'] }) {
  const res = { method: 'PATCH', url: `https://petstore3.swagger.io/api/v3/api/tenants/${id}` as const }
  return res
}

/**
 * {@link /api/tenants/:id}
 */
export async function tenantsControllerUpdateTenant(
  { id, data }: { id: TenantsControllerUpdateTenantPathParams['id']; data: TenantsControllerUpdateTenantMutationRequest },
  config: Partial<RequestConfig<TenantsControllerUpdateTenantMutationRequest>> & { client?: typeof fetch } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const requestData = tenantsControllerUpdateTenantMutationRequestSchema.parse(data)

  const res = await request<TenantsControllerUpdateTenantMutationResponse, ResponseErrorConfig<Error>, TenantsControllerUpdateTenantMutationRequest>({
    method: 'PATCH',
    url: getTenantsControllerUpdateTenantUrl({ id }).url.toString(),
    data: requestData,
    ...requestConfig,
  })
  return { ...res, data: tenantsControllerUpdateTenantMutationResponseSchema.parse(res.data) }
}
