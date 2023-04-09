import client from '../../../client'

import type { DeletePetRequest, DeletePetResponse, DeletePetPathParams } from '../../models/ts/petController/DeletePet'

/**
 * @description delete a pet
 * @summary Deletes a pet
 * @link /pet/:petId
 */
export function deletePet<TData = DeletePetResponse, TVariables = DeletePetRequest>(petId: DeletePetPathParams['petId'], data: TVariables) {
  return client<TData, TVariables>({
    method: 'delete',
    url: `/pet/${petId}`,
    data,
  })
}
