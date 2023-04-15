import client from '../../../../client'

import type { UpdatePetRequest, UpdatePetResponse } from '../../../models/ts/petController/UpdatePet'

/**
 * @description Update an existing pet by Id
 * @summary Update an existing pet
 * @link /pet
 */
export function updatePet<TData = UpdatePetResponse, TVariables = UpdatePetRequest>(data: TVariables) {
  return client<TData, TVariables>({
    method: 'put',
    url: `/pet`,
    data,
  })
}
