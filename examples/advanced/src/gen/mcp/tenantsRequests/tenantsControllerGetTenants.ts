import fetch from '@kubb/plugin-client/clients/axios'
import type { TenantsControllerGetTenantsQueryResponse } from '../../models/ts/tenantsController/TenantsControllerGetTenants.ts'
import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * {@link /api/tenants}
 */
export async function tenantsControllerGetTenantsHandler(): Promise<Promise<CallToolResult>> {
  const res = await fetch<TenantsControllerGetTenantsQueryResponse, ResponseErrorConfig<Error>, unknown>({
    method: 'GET',
    url: '/api/tenants',
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
