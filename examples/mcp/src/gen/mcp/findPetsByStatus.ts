import type { ResponseErrorConfig } from '../../client.js'
import fetch from '../../client.js'
import type { FindPetsByStatus400, FindPetsByStatusPathParams, FindPetsByStatusQueryResponse } from '../models/ts/FindPetsByStatus.js'

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * {@link /pet/findByStatus/:step_id}
 */
export async function findPetsByStatusHandler({ step_id }: { step_id: FindPetsByStatusPathParams['step_id'] }) {
  const res = await fetch<FindPetsByStatusQueryResponse, ResponseErrorConfig<FindPetsByStatus400>, unknown>({
    method: 'GET',
    url: `/pet/findByStatus/${step_id}`,
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
