import fetch from '@kubb/plugin-client/clients/axios'
import type {
  WeldPacksControllerDeleteWeldPackMutationResponse,
  WeldPacksControllerDeleteWeldPackPathParams,
} from '../../models/ts/weldPacksController/WeldPacksControllerDeleteWeldPack.ts'
import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * {@link /api/weldpacks/:id}
 */
export async function weldPacksControllerDeleteWeldPackHandler({
  id,
}: {
  id: WeldPacksControllerDeleteWeldPackPathParams['id']
}): Promise<Promise<CallToolResult>> {
  const res = await fetch<WeldPacksControllerDeleteWeldPackMutationResponse, ResponseErrorConfig<Error>, unknown>({
    method: 'DELETE',
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
