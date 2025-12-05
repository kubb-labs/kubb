import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import fetch from '../../../../axios-client.ts'
import type { DeletePet400, DeletePetHeaderParams, DeletePetMutationResponse, DeletePetPathParams } from '../../../models/ts/petController/DeletePet.ts'
import { deletePetMutationResponseSchema } from '../../../zod/petController/deletePetSchema.ts'

export function getDeletePetUrl({ petId }: { petId: DeletePetPathParams['petId'] }) {
  const res = { method: 'DELETE', url: `https://petstore3.swagger.io/api/v3/pet/${petId}:search` as const }
  return res
}

/**
 * @description delete a pet
 * @summary Deletes a pet
 * {@link /pet/:petId:search}
 */
export async function deletePet(
  { petId, headers }: { petId: DeletePetPathParams['petId']; headers?: DeletePetHeaderParams },
  config: Partial<RequestConfig> & { client?: typeof fetch } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<DeletePetMutationResponse, ResponseErrorConfig<DeletePet400>, unknown>({
    method: 'DELETE',
    url: getDeletePetUrl({ petId }).url.toString(),
    ...requestConfig,
    headers: { ...headers, ...requestConfig.headers },
  })
  return { ...res, data: deletePetMutationResponseSchema.parse(res.data) }
}
