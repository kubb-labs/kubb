import client from '@kubb/plugin-client/client'
import useSWR from 'swr'
import type { GetPetByIdQueryResponse, GetPetByIdPathParams, GetPetById400, GetPetById404 } from '../models/GetPetById.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'
import type { SWRConfiguration } from 'swr'

/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * @link /pet/:petId
 */
async function getPetById(petId: GetPetByIdPathParams['petId'], config: Partial<RequestConfig> = {}) {
  const res = await client<GetPetByIdQueryResponse, GetPetById400 | GetPetById404, unknown>({
    method: 'get',
    url: `/pet/${petId}`,
    baseURL: 'https://petstore3.swagger.io/api/v3',
    ...config,
  })
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
export function useGetPetById<TData = GetPetByIdQueryResponse>(
  petId: GetPetByIdPathParams['petId'],
  options: {
    query?: SWRConfiguration<TData, GetPetById400 | GetPetById404>
    client?: Partial<RequestConfig>
    shouldFetch?: boolean
  } = {},
) {
  const { query: queryOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const url = `/pet/${petId}`
  return useSWR<TData, GetPetById400 | GetPetById404, typeof url | null>(shouldFetch ? url : null, {
    ...getPetByIdQueryOptions(petId, config),
    ...queryOptions,
  })
}
