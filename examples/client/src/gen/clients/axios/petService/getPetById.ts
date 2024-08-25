import type { ResponseConfig } from '@kubb/plugin-client/client'
import type { GetPetByIdQueryResponse, GetPetByIdPathParams } from '../../../models/ts/petController/GetPetById'
import client from '@kubb/plugin-client/client'

/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * @link /pet/:petId
 */
export async function getPetById(
  petId: GetPetByIdPathParams['petId'],
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<GetPetByIdQueryResponse>['data']> {
  const res = await client<GetPetByIdQueryResponse>({ method: 'get', url: `/pet/${petId}`, baseURL: 'https://petstore3.swagger.io/api/v3', ...options })
  return res.data
}
