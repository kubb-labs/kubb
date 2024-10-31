import client from '@kubb/plugin-client/client'
import useSWR from 'swr'
import type { GetPetByIdQueryResponse, GetPetByIdPathParams, GetPetById400, GetPetById404 } from '../models/GetPetById.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'

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
  return {
    fetcher: async () => {
      return getPetById(petId, config)
    },
  }
}

/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * @link /pet/:petId
 */
export function useGetPetById(
  petId: GetPetByIdPathParams['petId'],
  options: {
    query?: Parameters<typeof useSWR<GetPetByIdQueryResponse, GetPetById400 | GetPetById404, GetPetByIdQueryKey | null, any>>[2]
    client?: Partial<RequestConfig>
    shouldFetch?: boolean
  } = {},
) {
  const { query: queryOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const queryKey = getPetByIdQueryKey(petId)
  return useSWR<GetPetByIdQueryResponse, GetPetById400 | GetPetById404, GetPetByIdQueryKey | null>(shouldFetch ? queryKey : null, {
    ...getPetByIdQueryOptions(petId, config),
    ...queryOptions,
  })
}
