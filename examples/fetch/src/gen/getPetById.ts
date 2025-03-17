import client from '@kubb/plugin-client/clients/fetch'
import type { GetPetByIdQueryResponse, GetPetByIdPathParams, GetPetById400, GetPetById404 } from './models.ts'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/fetch'

export function getGetPetByIdUrl(petId: GetPetByIdPathParams['petId']) {
  return `/pet/${petId}` as const
}

/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * {@link /pet/:petId}
 */
export async function getPetById(petId: GetPetByIdPathParams['petId'], config: Partial<RequestConfig> & { client?: typeof client } = {}) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<GetPetByIdQueryResponse, ResponseErrorConfig<GetPetById400 | GetPetById404>, unknown>({
    method: 'GET',
    url: getGetPetByIdUrl(petId).toString(),
    ...requestConfig,
  })
  return res.data
}
