import client from '@kubb/plugin-client/client'
import type { AddPetMutationRequest, AddPetMutationResponse } from '../../../models/ts/petController/AddPet.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'

/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * @link /pet
 */
export async function addPet(data: AddPetMutationRequest, config: Partial<RequestConfig> = {}) {
  const res = await client<AddPetMutationResponse, AddPetMutationRequest>({
    method: 'post',
    url: '/pet',
    baseURL: 'https://petstore3.swagger.io/api/v3',
    data,
    ...config,
  })
  return res.data
}
