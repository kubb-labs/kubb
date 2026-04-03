/* eslint-disable no-alert, no-console */
import fetch from '@kubb/plugin-client/clients/fetch'
import type { GetPetByIdPathParams, GetPetByIdQueryResponse, GetPetById400, GetPetById404 } from '../../../models/ts/petController/GetPetById.js'
import type { Client, RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/fetch'

function getGetPetByIdUrl({ petId }: { petId: GetPetByIdPathParams['petId'] }) {
  const res = { method: 'GET', url: `/pet/${petId}` as const }
  return res
}

/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * {@link /pet/:petId}
 */
export async function getPetById({ petId }: { petId: GetPetByIdPathParams['petId'] }, config: Partial<RequestConfig> & { client?: Client } = {}) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<GetPetByIdQueryResponse, ResponseErrorConfig<GetPetById400 | GetPetById404>, unknown>({
    method: 'GET',
    url: getGetPetByIdUrl({ petId }).url.toString(),
    ...requestConfig,
  })
  return res.data
}
