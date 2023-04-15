import client from '../../../../client'

import type { GetPetByIdResponse, GetPetByIdPathParams } from '../../../models/ts/petController/GetPetById'

/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * @link /pet/:petId
 */
export function getPetById<TData = GetPetByIdResponse>(petId: GetPetByIdPathParams['petId']) {
  return client<TData>({
    method: 'get',
    url: `/pet/${petId}`,
  })
}
