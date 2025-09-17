import fetch from '@kubb/plugin-client/clients/axios'
import type {
  WeldPacksControllerGetWeldPackQueryResponse,
  WeldPacksControllerGetWeldPackPathParams,
} from '../../models/ts/weldPacksController/WeldPacksControllerGetWeldPack.ts'
import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * {@link /api/weldpacks/:id}
 */
export async function weldPacksControllerGetWeldPackHandler({ id }: { id: WeldPacksControllerGetWeldPackPathParams['id'] }): Promise<Promise<CallToolResult>> {
  const res = await fetch<WeldPacksControllerGetWeldPackQueryResponse, ResponseErrorConfig<Error>, unknown>({
    method: 'GET',
    url: `/api/weldpacks/${id}`,
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
