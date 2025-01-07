import client from '@kubb/plugin-client/clients/fetch'
import type { UpdatePetWithFormMutationResponse, UpdatePetWithFormPathParams, UpdatePetWithFormQueryParams, UpdatePetWithForm405 } from './models.ts'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/fetch'

export function getUpdatePetWithFormUrl(petId: UpdatePetWithFormPathParams['petId']) {
  return new URL(`/pet/${petId}`)
}

/**
 * @summary Updates a pet in the store with form data
 * {@link /pet/:petId}
 */
export async function updatePetWithForm(
  petId: UpdatePetWithFormPathParams['petId'],
  params?: UpdatePetWithFormQueryParams,
  config: Partial<RequestConfig> = {},
) {
  const res = await client<UpdatePetWithFormMutationResponse, ResponseErrorConfig<UpdatePetWithForm405>, unknown>({
    method: 'POST',
    url: getUpdatePetWithFormUrl(petId).toString(),
    params,
    ...config,
  })
  return res.data
}
