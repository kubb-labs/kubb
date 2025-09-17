import fetch from '@kubb/plugin-client/clients/axios'
import type {
  ResellersControllerGetResellerQueryResponse,
  ResellersControllerGetResellerPathParams,
} from '../../models/ts/resellersController/ResellersControllerGetReseller.ts'
import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * {@link /api/resellers/:id}
 */
export async function resellersControllerGetResellerHandler({ id }: { id: ResellersControllerGetResellerPathParams['id'] }): Promise<Promise<CallToolResult>> {
  const res = await fetch<ResellersControllerGetResellerQueryResponse, ResponseErrorConfig<Error>, unknown>({
    method: 'GET',
    url: `/api/resellers/${id}`,
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
