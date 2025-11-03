import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import type { ResponseErrorConfig } from '../../.kubb/fetcher.ts'
import fetch from '../../.kubb/fetcher.ts'
import type { FindPetsByStatus400, FindPetsByStatusPathParams, FindPetsByStatusQueryResponse } from '../../models/ts/petController/FindPetsByStatus.ts'

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * {@link /pet/findByStatus/:step_id}
 */
export async function findPetsByStatusHandler({ stepId }: { stepId: FindPetsByStatusPathParams['step_id'] }): Promise<Promise<CallToolResult>> {
  const res = await fetch<FindPetsByStatusQueryResponse, ResponseErrorConfig<FindPetsByStatus400>, unknown>({
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
