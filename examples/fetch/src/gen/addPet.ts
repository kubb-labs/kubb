import client from '@kubb/plugin-client/clients/fetch'
import type { AddPetMutationRequest, AddPetMutationResponse, AddPet405 } from './models.ts'
import type { RequestConfig } from '@kubb/plugin-client/clients/fetch'

/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * {@link /pet}
 */
export async function addPet(data: AddPetMutationRequest, config: Partial<RequestConfig<AddPetMutationRequest>> = {}) {
  const res = await client<AddPetMutationResponse, AddPet405, AddPetMutationRequest>({ method: 'POST', url: '/pet', data, ...config })
  return res.data
}
