import fetch from '@kubb/plugin-client/clients/axios'
import type {
  ResellersControllerUpdateResellerMutationRequest,
  ResellersControllerUpdateResellerMutationResponse,
  ResellersControllerUpdateResellerPathParams,
} from '../../models/ts/resellersController/ResellersControllerUpdateReseller.ts'
import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * {@link /api/resellers/:id}
 */
export async function resellersControllerUpdateResellerHandler({
  id,
  data,
}: {
  id: ResellersControllerUpdateResellerPathParams['id']
  data: ResellersControllerUpdateResellerMutationRequest
}): Promise<Promise<CallToolResult>> {
  const requestData = data

  const res = await fetch<ResellersControllerUpdateResellerMutationResponse, ResponseErrorConfig<Error>, ResellersControllerUpdateResellerMutationRequest>({
    method: 'PATCH',
    url: `/api/resellers/${id}`,
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
