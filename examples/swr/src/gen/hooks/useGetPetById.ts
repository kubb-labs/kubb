import client from '@kubb/plugin-client/client'
import useSWR from 'swr'
import type { GetPetByIdQueryResponse, GetPetByIdPathParams, GetPetById400, GetPetById404 } from '../models/GetPetById.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'
import type { SWRConfiguration, SWRResponse } from 'swr'

type GetPetByIdClient = typeof client<GetPetByIdQueryResponse, GetPetById400 | GetPetById404, never>

type GetPetById = {
  data: GetPetByIdQueryResponse
  error: GetPetById400 | GetPetById404
  request: never
  pathParams: GetPetByIdPathParams
  queryParams: never
  headerParams: never
  response: GetPetByIdQueryResponse
  client: {
    parameters: Partial<Parameters<GetPetByIdClient>[0]>
    return: Awaited<ReturnType<GetPetByIdClient>>
  }
}

export function getPetByIdQueryOptions<TData = GetPetById['response']>(
  petId: GetPetByIdPathParams['petId'],
  config: Partial<RequestConfig> = {},
): SWRConfiguration<TData, GetPetById['error']> {
  return {
    fetcher: async () => {
      const res = await client<GetPetByIdQueryResponse>({ method: 'get', url: `/pet/${petId}`, baseURL: 'https://petstore3.swagger.io/api/v3', ...config })
      return res.data
    },
  }
}

/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * @link /pet/:petId
 */
export function useGetPetById<TData = GetPetById['response']>(
  petId: GetPetByIdPathParams['petId'],
  options?: {
    query?: SWRConfiguration<TData, GetPetById['error']>
    client?: GetPetById['client']['parameters']
    shouldFetch?: boolean
  },
): SWRResponse<TData, GetPetById['error']> {
  const { query: queryOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}
  const url = `/pet/${petId}`
  const query = useSWR<TData, GetPetById['error'], typeof url | null>(shouldFetch ? url : null, {
    ...getPetByIdQueryOptions<TData>(petId, clientOptions),
    ...queryOptions,
  })
  return query
}
