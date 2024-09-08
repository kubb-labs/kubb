import client from '../../../../swr-client.ts'
import useSWR from 'swr'
import type { RequestConfig } from '../../../../swr-client.ts'
import type { GetPetByIdQueryResponse, GetPetByIdPathParams, GetPetById400, GetPetById404 } from '../../../models/ts/petController/GetPetById.ts'
import type { SWRConfiguration, SWRResponse } from 'swr'
import { getPetByIdQueryResponseSchema } from '../../../zod/petController/getPetByIdSchema.ts'

type GetPetByIdClient = typeof client<GetPetByIdQueryResponse, GetPetById400 | GetPetById404, never>

type GetPetById = {
  data: GetPetByIdQueryResponse
  error: GetPetById400 | GetPetById404
  request: never
  pathParams: GetPetByIdPathParams
  queryParams: never
  headerParams: never
  response: Awaited<ReturnType<GetPetByIdClient>>
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
      return getPetByIdQueryResponseSchema.parse(res)
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
