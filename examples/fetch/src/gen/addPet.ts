import client from '../client.ts'
import type { RequestConfig } from '../client.ts'
import type { AddPetMutationRequest, AddPetMutationResponse, AddPet405 } from './models.ts'

/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * @link /pet
 */
export async function addPet(data: AddPetMutationRequest, config: Partial<RequestConfig<AddPetMutationRequest>> = {}) {
  const res = await client<AddPetMutationResponse, AddPet405, AddPetMutationRequest>({
    method: 'post',
    url: '/pet',
    baseURL: 'https://petstore3.swagger.io/api/v3',
    data,
    ...config,
  })
  return res.data
}
