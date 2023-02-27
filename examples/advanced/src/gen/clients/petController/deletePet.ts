import client from '../../../client'

import type { DeletePetRequest, DeletePetResponse, DeletePetPathParams } from '../../models/ts/DeletePet'

/**
 * @description delete a pet
 * @summary Deletes a pet
 * @link /pet/{petId}
 */
export const deletePet = <TData = DeletePetResponse, TVariables = DeletePetRequest>(petId: DeletePetPathParams['petId']) => {
  return client<TData, TVariables>({
    method: 'delete',
    url: `/pet/${petId}`,
  })
}
