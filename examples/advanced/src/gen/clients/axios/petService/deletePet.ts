import client from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { DeletePetMutationResponse, DeletePetPathParams, DeletePetHeaderParams, DeletePet400 } from '../../../models/ts/petController/DeletePet.ts'

export function getDeletePetUrl({ petId }: { petId: DeletePetPathParams['petId'] }) {
  return `https://petstore3.swagger.io/api/v3/pet/${petId}` as const
}

/**
 * @description delete a pet
 * @summary Deletes a pet
 * {@link /pet/:petId}
 */
export async function deletePet(
  { petId, headers }: { petId: DeletePetPathParams['petId']; headers?: DeletePetHeaderParams },
  config: Partial<RequestConfig> = {},
) {
  const res = await client<DeletePetMutationResponse, ResponseErrorConfig<DeletePet400>, unknown>({
    method: 'DELETE',
    url: getDeletePetUrl({ petId }).toString(),
    headers: { ...headers, ...config.headers },
    ...config,
  })
  return res
}
