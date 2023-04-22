import client from '../../../../client'

import type { UpdatePetWithFormResponse, UpdatePetWithFormPathParams, UpdatePetWithFormQueryParams } from '../../../models/ts/petController/UpdatePetWithForm'

/**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */
export function updatePetWithForm<TData = UpdatePetWithFormResponse>(petId: UpdatePetWithFormPathParams['petId'], params?: UpdatePetWithFormQueryParams) {
  return client<TData>({
    method: 'post',
    url: `/pet/${petId}`,

    params,
  })
}
