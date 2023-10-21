import client from '../../../../axios-client.ts'
import type { ResponseConfig } from '../../../../axios-client.ts'
import type { FindPetsByStatusQueryParams, FindPetsByStatusQueryResponse } from '../../../models/ts/petController/FindPetsByStatus'

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * @link /pet/findByStatus
 */
export async function findPetsByStatus<TData = FindPetsByStatusQueryResponse>(
  params?: FindPetsByStatusQueryParams,
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<TData>> {
  return client<TData>({
    method: 'get',
    url: `/pet/findByStatus`,
    params,
    ...options,
  })
}
