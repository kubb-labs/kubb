import client from '@kubb/swagger-client/client'
import type { ResponseConfig } from '@kubb/swagger-client/client'
import type { DeletePetHeaderParams, DeletePetMutationResponse, DeletePetPathParams } from '../../../models/ts/petController/DeletePet'

/**
 * @description delete a pet
 * @summary Deletes a pet
 * @link /pet/:petId
 */
export async function deletePet(
  petId: DeletePetPathParams['petId'],
  headers?: DeletePetHeaderParams,
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<DeletePetMutationResponse>['data']> {
  const res = await client<DeletePetMutationResponse>({
    method: 'delete',
    url: `/pet/${petId}`,
    headers: { ...headers, ...options.headers },
    ...options,
  })
  return res.data
}
