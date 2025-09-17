import fetch from '@kubb/plugin-client/clients/axios'
import type {
  WeldPacksControllerCreateWeldPackMutationRequest,
  WeldPacksControllerCreateWeldPackMutationResponse,
} from '../../models/ts/weldPacksController/WeldPacksControllerCreateWeldPack.ts'
import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * {@link /api/weldpacks}
 */
export async function weldPacksControllerCreateWeldPackHandler({
  data,
}: {
  data: WeldPacksControllerCreateWeldPackMutationRequest
}): Promise<Promise<CallToolResult>> {
  const requestData = data

  const res = await fetch<WeldPacksControllerCreateWeldPackMutationResponse, ResponseErrorConfig<Error>, WeldPacksControllerCreateWeldPackMutationRequest>({
    method: 'POST',
    url: '/api/weldpacks',
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
