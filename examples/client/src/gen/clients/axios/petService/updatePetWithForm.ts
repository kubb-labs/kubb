/* eslint-disable no-alert, no-console */
import client from '@kubb/plugin-client/clients/axios'
import type {
  UpdatePetWithFormMutationResponse,
  UpdatePetWithFormPathParams,
  UpdatePetWithFormQueryParams,
  UpdatePetWithForm405,
} from '../../../models/ts/petController/UpdatePetWithForm.js'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'

export function getUpdatePetWithFormUrl({ petId }: { petId: UpdatePetWithFormPathParams['petId'] }) {
  return `/pet/${petId}` as const
}

/**
 * @summary Updates a pet in the store with form data
 * {@link /pet/:petId}
 */
export async function updatePetWithForm(
  { petId }: { petId: UpdatePetWithFormPathParams['petId'] },
  params?: UpdatePetWithFormQueryParams,
  config: Partial<RequestConfig> & { client?: typeof client } = {},
) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<UpdatePetWithFormMutationResponse, ResponseErrorConfig<UpdatePetWithForm405>, unknown>({
    method: 'POST',
    url: getUpdatePetWithFormUrl({ petId }).toString(),
    params,
    ...requestConfig,
  })
  return res.data
}
