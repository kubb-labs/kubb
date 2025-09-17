import fetch from '@kubb/plugin-client/clients/axios'
import type {
  TenantsControllerGetTenantQueryResponse,
  TenantsControllerGetTenantPathParams,
} from '../../models/ts/tenantsController/TenantsControllerGetTenant.ts'
import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * {@link /api/tenants/:id}
 */
export async function tenantsControllerGetTenantHandler({ id }: { id: TenantsControllerGetTenantPathParams['id'] }): Promise<Promise<CallToolResult>> {
  const res = await fetch<TenantsControllerGetTenantQueryResponse, ResponseErrorConfig<Error>, unknown>({
    method: 'GET',
    url: `/api/tenants/${id}`,
    baseURL: 'https://petstore.swagger.io/v2',
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
