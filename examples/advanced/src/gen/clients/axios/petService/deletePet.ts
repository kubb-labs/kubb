import client from '../../../client'
import type { ResponseConfig } from '../../../client'
import type { DeletePetMutationResponse, DeletePetPathParams, DeletePetHeaderParams } from '../../../models/ts/petController/DeletePet'

/**
 * @description delete a pet
 * @summary Deletes a pet
 * @link /pet/:petId
 */
export async function deletePet<TData = DeletePetMutationResponse>(
  petId: DeletePetPathParams['petId'],
  headers?: DeletePetHeaderParams,
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<TData>['data']> {
  const { data: resData } = await client<TData>({
    method: 'delete',
    url: `/pet/${petId}`,
    headers: { ...headers, ...options.headers },
    ...options,
  })

  return resData
}
