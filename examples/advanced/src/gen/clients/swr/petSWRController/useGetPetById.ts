import client from '../../../../swr-client.ts'
import useSWR from 'swr'
import type { RequestConfig } from '../../../../swr-client.ts'
import type { GetPetByIdQueryResponse, GetPetByIdPathParams, GetPetById400, GetPetById404 } from '../../../models/ts/petController/GetPetById.ts'
import type { Key, SWRConfiguration } from 'swr'
import { getPetByIdQueryResponseSchema } from '../../../zod/petController/getPetByIdSchema.ts'

export const getPetByIdQueryKey = (petId: GetPetByIdPathParams['petId']) => [{ url: '/pet/:petId', params: { petId: petId } }] as const

export type GetPetByIdQueryKey = ReturnType<typeof getPetByIdQueryKey>

/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * @link /pet/:petId
 */
async function getPetById(petId: GetPetByIdPathParams['petId'], config: Partial<RequestConfig> = {}) {
  const res = await client<GetPetByIdQueryResponse, GetPetById400 | GetPetById404, unknown>({
    method: 'GET',
    url: `/pet/${petId}`,
    baseURL: 'https://petstore3.swagger.io/api/v3',
    ...config,
  })
  return getPetByIdQueryResponseSchema.parse(res.data)
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
    query?: SWRConfiguration<GetPetByIdQueryResponse, GetPetById400 | GetPetById404>
    client?: Partial<RequestConfig>
    shouldFetch?: boolean
  } = {},
) {
  const { query: queryOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const queryKey = getPetByIdQueryKey(petId)
  return useSWR<GetPetByIdQueryResponse, GetPetById400 | GetPetById404, Key>(shouldFetch ? queryKey : null, {
    ...getPetByIdQueryOptions(petId, config),
    ...queryOptions,
  })
}
