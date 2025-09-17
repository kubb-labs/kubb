import fetch from '@kubb/plugin-client/clients/axios'
import type {
  ResellersControllerCreateResellerMutationRequest,
  ResellersControllerCreateResellerMutationResponse,
} from '../../models/ts/resellersController/ResellersControllerCreateReseller.ts'
import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * {@link /api/resellers}
 */
export async function resellersControllerCreateResellerHandler({
  data,
}: {
  data: ResellersControllerCreateResellerMutationRequest
}): Promise<Promise<CallToolResult>> {
  const requestData = data

  const res = await fetch<ResellersControllerCreateResellerMutationResponse, ResponseErrorConfig<Error>, ResellersControllerCreateResellerMutationRequest>({
    method: 'POST',
    url: '/api/resellers',
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
