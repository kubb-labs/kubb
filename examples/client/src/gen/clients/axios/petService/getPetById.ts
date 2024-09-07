import client from '@kubb/plugin-client/client'
import type { GetPetByIdQueryResponse, GetPetByIdPathParams } from '../../../models/ts/petController/GetPetById.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'

/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * @link /pet/:petId
 */
export async function getPetById(
  {
    petId,
  }: {
    petId: GetPetByIdPathParams['petId']
  },
  config: Partial<RequestConfig> = {},
) {
  const res = await client<GetPetByIdQueryResponse>({ method: 'get', url: `/pet/${petId}`, baseURL: 'https://petstore3.swagger.io/api/v3', ...config })
  return res.data
}
