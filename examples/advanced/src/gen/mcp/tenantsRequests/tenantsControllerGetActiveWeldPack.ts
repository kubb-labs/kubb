import fetch from '@kubb/plugin-client/clients/axios'
import type {
  TenantsControllerGetActiveWeldPackQueryResponse,
  TenantsControllerGetActiveWeldPackPathParams,
} from '../../models/ts/tenantsController/TenantsControllerGetActiveWeldPack.ts'
import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * {@link /api/tenants/:id/active-weldpack}
 */
export async function tenantsControllerGetActiveWeldPackHandler({
  id,
}: {
  id: TenantsControllerGetActiveWeldPackPathParams['id']
}): Promise<Promise<CallToolResult>> {
  const res = await fetch<TenantsControllerGetActiveWeldPackQueryResponse, ResponseErrorConfig<Error>, unknown>({
    method: 'GET',
    url: `/api/tenants/${id}/active-weldpack`,
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
