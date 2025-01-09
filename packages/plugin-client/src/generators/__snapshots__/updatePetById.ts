/* eslint-disable no-alert, no-console */
import client from '@kubb/plugin-client/clients/axios'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'

export function getUpdatePetWithFormUrl(petId: UpdatePetWithFormPathParams['petId']) {
  return `/pet/${petId}` as const
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
