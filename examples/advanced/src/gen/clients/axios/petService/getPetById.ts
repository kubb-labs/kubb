import fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { GetPetByIdQueryResponse, GetPetByIdPathParams, GetPetById400, GetPetById404 } from '../../../models/ts/petController/GetPetById.ts'
import { getPetByIdQueryResponseSchema } from '../../../zod/petController/getPetByIdSchema.ts'

export function getGetPetByIdUrl({ petId }: { petId: GetPetByIdPathParams['petId'] }) {
  return `https://petstore3.swagger.io/api/v3/pet/${petId}:search` as const
}

/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * {@link /pet/:petId:search}
 */
export async function getPetById({ petId }: { petId: GetPetByIdPathParams['petId'] }, config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<GetPetByIdQueryResponse, ResponseErrorConfig<GetPetById400 | GetPetById404>, unknown>({
    method: 'GET',
    url: getGetPetByIdUrl({ petId }).toString(),
    ...requestConfig,
  })
  return { ...res, data: getPetByIdQueryResponseSchema.parse(res.data) }
}
