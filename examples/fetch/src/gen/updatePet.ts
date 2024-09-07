import client from '../client.ts'
import type { RequestConfig } from '../client.ts'
import type { UpdatePetMutationRequest, UpdatePetMutationResponse } from './models.ts'

/**
 * @description Update an existing pet by Id
 * @summary Update an existing pet
 * @link /pet
 */
export async function updatePet(data: UpdatePetMutationRequest, config: Partial<RequestConfig> = {}) {
  const res = await client<UpdatePetMutationResponse, UpdatePetMutationRequest>({
    method: 'put',
    url: '/pet',
    baseURL: 'https://petstore3.swagger.io/api/v3',
    data,
    ...config,
  })
  return res.data
}
