import fetch from '@kubb/plugin-client/clients/axios'
import type {
  TenantsControllerGetActiveLicenseQueryResponse,
  TenantsControllerGetActiveLicensePathParams,
} from '../../models/ts/tenantsController/TenantsControllerGetActiveLicense.ts'
import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * {@link /api/tenants/:id/active-license}
 */
export async function tenantsControllerGetActiveLicenseHandler({
  id,
}: {
  id: TenantsControllerGetActiveLicensePathParams['id']
}): Promise<Promise<CallToolResult>> {
  const res = await fetch<TenantsControllerGetActiveLicenseQueryResponse, ResponseErrorConfig<Error>, unknown>({
    method: 'GET',
    url: `/api/tenants/${id}/active-license`,
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
