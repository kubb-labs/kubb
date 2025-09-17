import fetch from '@kubb/plugin-client/clients/axios'
import type {
  PartsControllerDownloadPartMutationRequest,
  PartsControllerDownloadPartMutationResponse,
  PartsControllerDownloadPartPathParams,
} from '../../models/ts/partsController/PartsControllerDownloadPart.ts'
import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * {@link /api/parts/:urn/download}
 */
export async function partsControllerDownloadPartHandler({
  urn,
  data,
}: {
  urn: PartsControllerDownloadPartPathParams['urn']
  data: PartsControllerDownloadPartMutationRequest
}): Promise<Promise<CallToolResult>> {
  const requestData = data

  const res = await fetch<PartsControllerDownloadPartMutationResponse, ResponseErrorConfig<Error>, PartsControllerDownloadPartMutationRequest>({
    method: 'POST',
    url: `/api/parts/${urn}/download`,
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
