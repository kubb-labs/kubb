import client from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { FindPetsByStatusQueryResponse, FindPetsByStatusPathParams, FindPetsByStatus400 } from '../../../models/ts/petController/FindPetsByStatus.ts'

export function getFindPetsByStatusUrl({ step_id }: { step_id: FindPetsByStatusPathParams['step_id'] }) {
  return new URL(`/pet/findByStatus/${step_id}`, 'https://petstore3.swagger.io/api/v3')
}

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * {@link /pet/findByStatus/:step_id}
 */
export async function findPetsByStatus({ step_id }: { step_id: FindPetsByStatusPathParams['step_id'] }, config: Partial<RequestConfig> = {}) {
  const res = await client<FindPetsByStatusQueryResponse, ResponseErrorConfig<FindPetsByStatus400>, unknown>({
    method: 'GET',
    url: getFindPetsByStatusUrl({ step_id }).toString(),
    ...config,
  })
  return res
}
