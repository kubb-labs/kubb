import fetch from '@kubb/plugin-client/clients/axios'
import type { ResellersControllerGetResellersQueryResponse } from '../../models/ts/resellersController/ResellersControllerGetResellers.ts'
import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * {@link /api/resellers}
 */
export async function resellersControllerGetResellersHandler(): Promise<Promise<CallToolResult>> {
  const res = await fetch<ResellersControllerGetResellersQueryResponse, ResponseErrorConfig<Error>, unknown>({
    method: 'GET',
    url: '/api/resellers',
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
