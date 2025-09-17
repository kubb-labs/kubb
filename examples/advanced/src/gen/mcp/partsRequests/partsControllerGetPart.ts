import fetch from '@kubb/plugin-client/clients/axios'
import type { PartsControllerGetPartQueryResponse, PartsControllerGetPartPathParams } from '../../models/ts/partsController/PartsControllerGetPart.ts'
import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * {@link /api/parts/:urn}
 */
export async function partsControllerGetPartHandler({ urn }: { urn: PartsControllerGetPartPathParams['urn'] }): Promise<Promise<CallToolResult>> {
  const res = await fetch<PartsControllerGetPartQueryResponse, ResponseErrorConfig<Error>, unknown>({
    method: 'GET',
    url: `/api/parts/${urn}`,
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
