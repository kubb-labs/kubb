import client from '@kubb/plugin-client/clients/axios'
import type { GetPetByIdQueryResponse, GetPetByIdPathParams, GetPetById400, GetPetById404 } from '../models/GetPetById.ts'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import { queryOptions } from '@tanstack/solid-query'

export const getPetByIdQueryKey = (petId: GetPetByIdPathParams['petId']) => [{ url: '/pet/:petId', params: { petId: petId } }] as const

export type GetPetByIdQueryKey = ReturnType<typeof getPetByIdQueryKey>

/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * {@link /pet/:petId}
 */
export async function getPetById(petId: GetPetByIdPathParams['petId'], config: Partial<RequestConfig> & { client?: typeof client } = {}) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<GetPetByIdQueryResponse, ResponseErrorConfig<GetPetById400 | GetPetById404>, unknown>({
    method: 'GET',
    url: `/pet/${petId}`,
    ...requestConfig,
  })
  return res.data
}

export function getPetByIdQueryOptions(petId: GetPetByIdPathParams['petId'], config: Partial<RequestConfig> & { client?: typeof client } = {}) {
  const queryKey = getPetByIdQueryKey(petId)
  return queryOptions<GetPetByIdQueryResponse, ResponseErrorConfig<GetPetById400 | GetPetById404>, GetPetByIdQueryResponse, typeof queryKey>({
    enabled: !!petId,
    queryKey,
    queryFn: async ({ signal }) => {
      config.signal = signal
      return getPetById(petId, config)
    },
  })
}
