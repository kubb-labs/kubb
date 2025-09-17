import fetch from '@kubb/plugin-client/clients/axios'
import type {
  TenantsControllerGetWeldCreditsQueryResponse,
  TenantsControllerGetWeldCreditsPathParams,
} from '../../models/ts/tenantsController/TenantsControllerGetWeldCredits.ts'
import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * {@link /api/tenants/:id/weld-credits}
 */
export async function tenantsControllerGetWeldCreditsHandler({
  id,
}: {
  id: TenantsControllerGetWeldCreditsPathParams['id']
}): Promise<Promise<CallToolResult>> {
  const res = await fetch<TenantsControllerGetWeldCreditsQueryResponse, ResponseErrorConfig<Error>, unknown>({
    method: 'GET',
    url: `/api/tenants/${id}/weld-credits`,
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
