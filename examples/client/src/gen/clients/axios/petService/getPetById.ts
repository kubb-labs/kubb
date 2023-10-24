import client from '../../../client'

import type { ResponseConfig } from '../../../client'
import type { GetPetByIdPathParams, GetPetByIdQueryResponse } from '../../../models/ts/petController/GetPetById'

/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * @link /pet/:petId
 */
export async function getPetById<TData = GetPetByIdQueryResponse>(
  petId: GetPetByIdPathParams['petId'],
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<TData>['data']> {
  const { data: resData } = await client<TData>({
    method: 'get',
    url: `/pet/${petId}`,
    ...options,
  })

  return resData
}
