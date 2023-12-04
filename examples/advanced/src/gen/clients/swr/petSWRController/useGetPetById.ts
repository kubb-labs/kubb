import useSWR from 'swr'
import client from '../../../../swr-client.ts'
import type { SWRConfiguration, SWRResponse } from 'swr'
import type { ResponseConfig } from '../../../../swr-client.ts'
import type { GetPetByIdQueryResponse, GetPetByIdPathParams, GetPetById400, GetPetById404 } from '../../../models/ts/petController/GetPetById'

export function getPetByIdQueryOptions<TData = GetPetByIdQueryResponse, TError = GetPetById400 | GetPetById404>(
  petId: GetPetByIdPathParams['petId'],
  options: Partial<Parameters<typeof client>[0]> = {},
): SWRConfiguration<ResponseConfig<TData>, TError> {
  return {
    fetcher: () => {
      return client<TData, TError>({
        method: 'get',
        url: `/pet/${petId}`,
        ...options,
      }).then(res => res)
    },
  }
}
/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * @link /pet/:petId */
export function useGetPetById<TData = GetPetByIdQueryResponse, TError = GetPetById400 | GetPetById404>(petId: GetPetByIdPathParams['petId'], options?: {
  query?: SWRConfiguration<ResponseConfig<TData>, TError>
  client?: Partial<Parameters<typeof client<TData, TError>>[0]>
  shouldFetch?: boolean
}): SWRResponse<ResponseConfig<TData>, TError> {
  const { query: queryOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}
  const url = `/pet/${petId}` as const
  const query = useSWR<ResponseConfig<TData>, TError, typeof url | null>(shouldFetch ? url : null, {
    ...getPetByIdQueryOptions<TData, TError>(petId, clientOptions),
    ...queryOptions,
  })
  return query
}
