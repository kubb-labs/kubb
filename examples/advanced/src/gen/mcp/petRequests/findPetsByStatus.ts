import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import fetch from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import type { FindPetsByStatusPathParams, FindPetsByStatusResponseData, FindPetsByStatusStatus400 } from '../../models/ts/petController/FindPetsByStatus.ts'

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * {@link /pet/findByStatus/:step_id}
 */
export async function findPetsByStatusHandler({ stepId }: { stepId: FindPetsByStatusPathParams['step_id'] }): Promise<Promise<CallToolResult>> {
  const res = await fetch<FindPetsByStatusResponseData, ResponseErrorConfig<FindPetsByStatusStatus400>, unknown>({
    method: 'GET',
    url: `/pet/findByStatus/${stepId}`,
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
