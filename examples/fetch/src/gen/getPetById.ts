import client from '../client.ts'
import type { RequestConfig } from '../client.ts'
import type { GetPetByIdQueryResponse, GetPetByIdPathParams, GetPetById400, GetPetById404 } from './models.ts'

/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * @link /pet/:petId
 */
export async function getPetById(petId: GetPetByIdPathParams['petId'], config: Partial<RequestConfig> = {}) {
  const res = await client<GetPetByIdQueryResponse, GetPetById400 | GetPetById404, unknown>({
    method: 'GET',
    url: `/pet/${petId}`,
    baseURL: 'https://petstore3.swagger.io/api/v3',
    ...config,
  })
  return res.data
}
