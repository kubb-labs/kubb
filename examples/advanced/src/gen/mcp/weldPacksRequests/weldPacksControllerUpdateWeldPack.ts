import fetch from '@kubb/plugin-client/clients/axios'
import type {
  WeldPacksControllerUpdateWeldPackMutationRequest,
  WeldPacksControllerUpdateWeldPackMutationResponse,
  WeldPacksControllerUpdateWeldPackPathParams,
} from '../../models/ts/weldPacksController/WeldPacksControllerUpdateWeldPack.ts'
import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * {@link /api/weldpacks/:id}
 */
export async function weldPacksControllerUpdateWeldPackHandler({
  id,
  data,
}: {
  id: WeldPacksControllerUpdateWeldPackPathParams['id']
  data: WeldPacksControllerUpdateWeldPackMutationRequest
}): Promise<Promise<CallToolResult>> {
  const requestData = data

  const res = await fetch<WeldPacksControllerUpdateWeldPackMutationResponse, ResponseErrorConfig<Error>, WeldPacksControllerUpdateWeldPackMutationRequest>({
    method: 'PATCH',
    url: `/api/weldpacks/${id}`,
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
