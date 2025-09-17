import fetch from '@kubb/plugin-client/clients/axios'
import type {
  PartsControllerSimulatePartMutationRequest,
  PartsControllerSimulatePartMutationResponse,
  PartsControllerSimulatePartPathParams,
} from '../../models/ts/partsController/PartsControllerSimulatePart.ts'
import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * {@link /api/parts/:urn/simulate}
 */
export async function partsControllerSimulatePartHandler({
  urn,
  data,
}: {
  urn: PartsControllerSimulatePartPathParams['urn']
  data: PartsControllerSimulatePartMutationRequest
}): Promise<Promise<CallToolResult>> {
  const requestData = data

  const res = await fetch<PartsControllerSimulatePartMutationResponse, ResponseErrorConfig<Error>, PartsControllerSimulatePartMutationRequest>({
    method: 'POST',
    url: `/api/parts/${urn}/simulate`,
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
