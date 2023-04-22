import client from '../../../../client'

import type { DeletePetResponse, DeletePetPathParams } from '../../../models/ts/petController/DeletePet'

/**
 * @description delete a pet
 * @summary Deletes a pet
 * @link /pet/:petId
 */
export function deletePet<TData = DeletePetResponse>(petId: DeletePetPathParams['petId']) {
  return client<TData>({
    method: 'delete',
    url: `/pet/${petId}`,
  })
}
