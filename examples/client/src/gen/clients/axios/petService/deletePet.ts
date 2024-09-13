/* eslint-disable no-alert, no-console */
import client from '@kubb/plugin-client/client'
import type { DeletePetMutationResponse, DeletePetPathParams, DeletePetHeaderParams, DeletePet400 } from '../../../models/ts/petController/DeletePet.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'

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
  config: Partial<RequestConfig> = {},
) {
  const res = await client<DeletePetMutationResponse, DeletePet400, unknown>({
    method: 'delete',
    url: `/pet/${petId}`,
    baseURL: 'https://petstore3.swagger.io/api/v3',
    headers: { ...headers, ...config.headers },
    ...config,
  })
  return res.data
}
