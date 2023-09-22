import client from '../../../client'
import type { FindPetsByStatusQueryResponse, FindpetsbystatusQueryparams } from '../../../models/ts/petController/FindPetsByStatus'

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * @link /pet/findByStatus
 */

export function findPetsByStatus<TData = FindPetsByStatusQueryResponse>(
  params?: FindpetsbystatusQueryparams,
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<TData> {
  return client<TData>({
    method: 'get',
    url: `/pet/findByStatus`,
    params,

    ...options,
  })
}
