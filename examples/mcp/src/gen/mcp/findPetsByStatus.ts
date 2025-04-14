import client from '../../client.js'
import type { ResponseErrorConfig } from '../../client.js'
import type { FindPetsByStatusQueryResponse, FindPetsByStatusPathParams, FindPetsByStatus400 } from '../models/ts/FindPetsByStatus.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * {@link /pet/findByStatus/:step_id}
 */
export async function findPetsByStatusHandler({ stepId }: { stepId: FindPetsByStatusPathParams['step_id'] }): Promise<Promise<CallToolResult>> {
  const res = await client<FindPetsByStatusQueryResponse, ResponseErrorConfig<FindPetsByStatus400>, unknown>({
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
