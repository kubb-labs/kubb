import fetch from '@kubb/plugin-client/clients/axios'
import type {
  TenantsControllerCreateTenantMutationRequest,
  TenantsControllerCreateTenantMutationResponse,
} from '../../models/ts/tenantsController/TenantsControllerCreateTenant.ts'
import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * {@link /api/tenants}
 */
export async function tenantsControllerCreateTenantHandler({ data }: { data: TenantsControllerCreateTenantMutationRequest }): Promise<Promise<CallToolResult>> {
  const requestData = data

  const res = await fetch<TenantsControllerCreateTenantMutationResponse, ResponseErrorConfig<Error>, TenantsControllerCreateTenantMutationRequest>({
    method: 'POST',
    url: '/api/tenants',
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
