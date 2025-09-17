import fetch from '@kubb/plugin-client/clients/axios'
import type {
  TenantsControllerUpdateTenantMutationRequest,
  TenantsControllerUpdateTenantMutationResponse,
  TenantsControllerUpdateTenantPathParams,
} from '../../models/ts/tenantsController/TenantsControllerUpdateTenant.ts'
import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * {@link /api/tenants/:id}
 */
export async function tenantsControllerUpdateTenantHandler({
  id,
  data,
}: {
  id: TenantsControllerUpdateTenantPathParams['id']
  data: TenantsControllerUpdateTenantMutationRequest
}): Promise<Promise<CallToolResult>> {
  const requestData = data

  const res = await fetch<TenantsControllerUpdateTenantMutationResponse, ResponseErrorConfig<Error>, TenantsControllerUpdateTenantMutationRequest>({
    method: 'PATCH',
    url: `/api/tenants/${id}`,
    baseURL: 'https://petstore.swagger.io/v2',
    data: requestData,
  })
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(res.data),
      },
    ],
  }
}
