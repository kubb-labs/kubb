import client from '../../../client'
import type { DeletePetMutationResponse, DeletePetPathParams } from '../../../models/ts/petController/DeletePet'

/**
 * @description delete a pet
 * @summary Deletes a pet
 * @link /pet/:petId
 */
export function deletePet<TData = DeletePetMutationResponse>(
  petId: DeletePetPathParams['petId'],
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<TData> {
  return client<TData>({
    method: 'delete',
    url: `/pet/${petId}`,
    ...options,
  })
}
