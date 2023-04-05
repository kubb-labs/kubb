import client from '../../../client'

import type { UpdatePetWithFormRequest, UpdatePetWithFormResponse, UpdatePetWithFormPathParams } from '../../models/ts/petController/UpdatePetWithForm'

/**
 * @summary Updates a pet in the store with form data
 * @link /pet/{petId}
 */
export function updatePetWithForm<TData = UpdatePetWithFormResponse, TVariables = UpdatePetWithFormRequest>(
  petId: UpdatePetWithFormPathParams['petId'],
  data: TVariables
) {
  return client<TData, TVariables>({
    method: 'post',
    url: `/pet/${petId}`,
    data,
  })
}
