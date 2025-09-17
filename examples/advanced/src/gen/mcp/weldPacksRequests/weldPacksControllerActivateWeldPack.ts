import fetch from '@kubb/plugin-client/clients/axios'
import type {
  WeldPacksControllerActivateWeldPackMutationRequest,
  WeldPacksControllerActivateWeldPackMutationResponse,
  WeldPacksControllerActivateWeldPackPathParams,
} from '../../models/ts/weldPacksController/WeldPacksControllerActivateWeldPack.ts'
import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * {@link /api/weldpacks/:id/activate}
 */
export async function weldPacksControllerActivateWeldPackHandler({
  id,
  data,
}: {
  id: WeldPacksControllerActivateWeldPackPathParams['id']
  data: WeldPacksControllerActivateWeldPackMutationRequest
}): Promise<Promise<CallToolResult>> {
  const requestData = data

  const res = await fetch<WeldPacksControllerActivateWeldPackMutationResponse, ResponseErrorConfig<Error>, WeldPacksControllerActivateWeldPackMutationRequest>({
    method: 'POST',
    url: `/api/weldpacks/${id}/activate`,
    baseURL: 'https://petstore.swagger.io/v2',
    data: requestData,
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
