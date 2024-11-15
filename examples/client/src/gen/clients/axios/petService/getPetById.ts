/* eslint-disable no-alert, no-console */
import client from '@kubb/plugin-client/client'
import type { GetPetByIdQueryResponse, GetPetByIdPathParams, GetPetById400, GetPetById404 } from '../../../models/ts/petController/GetPetById.js'
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
  const res = await client<GetPetByIdQueryResponse, GetPetById400 | GetPetById404, unknown>({ method: 'GET', url: `/pet/${petId}`, ...config })
  return res.data
}
