import fetch from '@kubb/plugin-client/clients/axios'
import type { WeldPacksControllerGetWeldPacksQueryResponse } from '../../models/ts/weldPacksController/WeldPacksControllerGetWeldPacks.ts'
import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * {@link /api/weldpacks}
 */
export async function weldPacksControllerGetWeldPacksHandler(): Promise<Promise<CallToolResult>> {
  const res = await fetch<WeldPacksControllerGetWeldPacksQueryResponse, ResponseErrorConfig<Error>, unknown>({
    method: 'GET',
    url: '/api/weldpacks',
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
