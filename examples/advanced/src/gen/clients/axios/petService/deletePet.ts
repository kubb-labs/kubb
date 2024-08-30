import client from '../../../../axios-client.ts'
import type { ResponseConfig } from '../../../../axios-client.ts'
import type { DeletePetMutationResponse, DeletePetPathParams, DeletePetHeaderParams } from '../../../models/ts/petController/DeletePet.ts'

/**
 * @description delete a pet
 * @summary Deletes a pet
 * @link /pet/:petId
 */
export async function deletePet(
  {
    petId,
  }: {
    petId: DeletePetPathParams['petId']
  },
  headers?: DeletePetHeaderParams,
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<DeletePetMutationResponse>> {
  const res = await client<DeletePetMutationResponse>({ method: 'delete', url: `/pet/${petId}`, headers: { ...headers, ...options.headers }, ...options })
  return res
}
