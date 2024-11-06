import client from '@kubb/plugin-client/client'
import type { GetPetByIdQueryResponse, GetPetByIdPathParams, GetPetById400, GetPetById404 } from '../models/GetPetById.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'
import { queryOptions } from '@tanstack/solid-query'

export const getPetByIdQueryKey = (petId: GetPetByIdPathParams['petId']) => [{ url: '/pet/:petId', params: { petId: petId } }] as const

export type GetPetByIdQueryKey = ReturnType<typeof getPetByIdQueryKey>

/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * @link /pet/:petId
 */
async function getPetById(petId: GetPetByIdPathParams['petId'], config: Partial<RequestConfig> = {}) {
  const res = await client<GetPetByIdQueryResponse, GetPetById400 | GetPetById404, unknown>({ method: 'GET', url: `/pet/${petId}`, ...config })
  return res.data
}

export function getPetByIdQueryOptions(petId: GetPetByIdPathParams['petId'], config: Partial<RequestConfig> = {}) {
  const queryKey = getPetByIdQueryKey(petId)
  return queryOptions({
    enabled: !!petId,
    queryKey,
    queryFn: async ({ signal }) => {
      config.signal = signal
      return getPetById(petId, config)
    },
  })
}
