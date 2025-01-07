import client from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { GetPetByIdQueryResponse, GetPetByIdPathParams, GetPetById400, GetPetById404 } from '../../../models/ts/petController/GetPetById.ts'

export function getGetPetByIdUrl({ petId }: { petId: GetPetByIdPathParams['petId'] }) {
  return new URL(`/pet/${petId}`, 'https://petstore3.swagger.io/api/v3')
}

/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * {@link /pet/:petId}
 */
export async function getPetById({ petId }: { petId: GetPetByIdPathParams['petId'] }, config: Partial<RequestConfig> = {}) {
  const res = await client<GetPetByIdQueryResponse, ResponseErrorConfig<GetPetById400 | GetPetById404>, unknown>({
    method: 'GET',
    url: getGetPetByIdUrl({ petId }).toString(),
    ...config,
  })
  return res
}
