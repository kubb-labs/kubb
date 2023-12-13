import client from '../../../../axios-client.ts'
import type { ResponseConfig } from '../../../../axios-client.ts'
import type { FindPetsByStatusQuery } from '../../../models/ts/petController/FindPetsByStatus'

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * @link /pet/findByStatus */
export async function findPetsByStatus(
  params?: FindPetsByStatusQuery.QueryParams,
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<FindPetsByStatusQuery.Response>> {
  const res = await client<FindPetsByStatusQuery.Response>({
    method: 'get',
    url: `/pet/findByStatus`,
    params,
    ...options,
  })
  return res
}
