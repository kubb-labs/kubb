import fetch from '@kubb/plugin-client/clients/axios'
import type { PartsControllerGetPartsQueryResponse } from '../../models/ts/partsController/PartsControllerGetParts.ts'
import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * {@link /api/parts}
 */
export async function partsControllerGetPartsHandler(): Promise<Promise<CallToolResult>> {
  const res = await fetch<PartsControllerGetPartsQueryResponse, ResponseErrorConfig<Error>, unknown>({
    method: 'GET',
    url: '/api/parts',
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
