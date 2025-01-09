/* eslint-disable no-alert, no-console */
import client from '@kubb/plugin-client/clients/axios'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'

export function getDeletePetURL(petId: DeletePetPathParams['petId']) {
  return `/pet/${petId}` as const
}

/**
 * @description delete a pet
 * @summary Deletes a pet
 * {@link /pet/:petId}
 */
export async function deletePet(petId: DeletePetPathParams['petId'], headers?: DeletePetHeaderParams, config: Partial<RequestConfig> = {}) {
  const res = await client<DeletePetMutationResponse, ResponseErrorConfig<DeletePet400>, unknown>({
    method: 'DELETE',
    url: getDeletePetURL(petId).toString(),
    headers: { ...headers, ...config.headers },
    ...config,
  })
  return res.data
}
