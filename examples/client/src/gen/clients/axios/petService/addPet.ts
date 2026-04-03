/* eslint-disable no-alert, no-console */
import fetch from '@kubb/plugin-client/clients/fetch'
import type { AddPetMutationRequest, AddPetMutationResponse, AddPet405 } from '../../../models/ts/petController/AddPet.js'
import type { Client, RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/fetch'

function getAddPetUrl() {
  const res = { method: 'POST', url: '/pet' as const }
  return res
}

/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * {@link /pet}
 */
export async function addPet(
  data: AddPetMutationRequest,
  config: Partial<RequestConfig<AddPetMutationRequest>> & {
    client?: Client
  } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const requestData = data

  const res = await request<AddPetMutationResponse, ResponseErrorConfig<AddPet405>, AddPetMutationRequest>({
    method: 'POST',
    url: getAddPetUrl().url.toString(),
    data: requestData,
    ...requestConfig,
  })
  return res.data
}
