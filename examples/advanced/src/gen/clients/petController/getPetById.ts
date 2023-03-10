import client from '../../../client'

import type { GetPetByIdResponse, GetPetByIdPathParams, GetPetByIdQueryParams } from '../../models/ts/GetPetById'

/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * @link /pet/{petId}
 * @deprecated
 */
export function getPetById<TData = GetPetByIdResponse>(petId: GetPetByIdPathParams['petId'], params?: GetPetByIdQueryParams) {
  return client<TData>({
    method: 'get',
    url: `/pet/${petId}`,
    params,
  })
}
