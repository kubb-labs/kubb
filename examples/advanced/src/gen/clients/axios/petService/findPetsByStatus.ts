import client from '../../../../axios-client.ts'
import type { ResponseConfig } from '../../../../axios-client.ts'
import type { FindPetsByStatusQueryResponse, FindPetsByStatusQueryParams } from '../../../models/ts/petController/FindPetsByStatus'

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * @link /pet/findByStatus
 */
export async function findPetsByStatus(
  params?: FindPetsByStatusQueryParams,
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<FindPetsByStatusQueryResponse>> {
  return client<FindPetsByStatusQueryResponse>({
    method: 'get',
    url: `/pet/findByStatus`,
    params,
    ...options,
  })
}
