import useSWR from 'swr'
import client from '../../../../swr-client.ts'
import type { SWRConfiguration, SWRResponse } from 'swr'
import type { GetPetByIdQueryResponse, GetPetByIdPathParams, GetPetById400, GetPetById404 } from '../../../models/ts/petController/GetPetById'

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

export function getPetByIdQueryOptions<TData extends GetPetById['response'] = GetPetById['response'], TError = GetPetById['error']>(
  petId: GetPetByIdPathParams['petId'],
  options: GetPetById['client']['parameters'] = {},
): SWRConfiguration<TData, TError> {
  return {
    fetcher: async () => {
      const res = await client<TData, TError>({
        method: 'get',
        url: `/pet/${petId}`,
        ...options,
      })

      return res
    },
  }
}
/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * @link /pet/:petId */

export function useGetPetById<TData extends GetPetById['response'] = GetPetById['response'], TError = GetPetById['error']>(
  petId: GetPetByIdPathParams['petId'],
  options?: {
    query?: SWRConfiguration<TData, TError>
    client?: GetPetById['client']['parameters']
    shouldFetch?: boolean
  },
): SWRResponse<TData, TError> {
  const { query: queryOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}

  const url = `/pet/${petId}` as const
  const query = useSWR<TData, TError, typeof url | null>(
    shouldFetch ? url : null,
    {
      ...getPetByIdQueryOptions<TData, TError>(petId, clientOptions),
      ...queryOptions,
    },
  )

  return query
}
