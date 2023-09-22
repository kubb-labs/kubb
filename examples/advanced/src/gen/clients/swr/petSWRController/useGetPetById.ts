import useSWR from 'swr'
import type { SWRConfiguration, SWRResponse } from 'swr'
import client from '../../../../client'
import type { GetPetByIdQueryResponse, GetPetByIdPathParams, Getpetbyid400, Getpetbyid404 } from '../../../models/ts/petController/GetPetById'

export function getPetByIdQueryOptions<TData = GetPetByIdQueryResponse, TError = Getpetbyid400 | Getpetbyid404>(
  petId: GetPetByIdPathParams['petId'],
  options: Partial<Parameters<typeof client>[0]> = {},
): SWRConfiguration<TData, TError> {
  return {
    fetcher: () => {
      return client<TData, TError>({
        method: 'get',
        url: `/pet/${petId}`,

        ...options,
      })
    },
  }
}

/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * @link /pet/:petId
 */

export function useGetpetbyid<TData = GetPetByIdQueryResponse, TError = Getpetbyid400 | Getpetbyid404>(
  petId: GetPetByIdPathParams['petId'],
  options?: {
    query?: SWRConfiguration<TData, TError>
    client?: Partial<Parameters<typeof client<TData, TError>>[0]>
  },
): SWRResponse<TData, TError> {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}

  const query = useSWR<TData, TError, string>(`/pet/${petId}`, {
    ...getPetByIdQueryOptions<TData, TError>(petId, clientOptions),
    ...queryOptions,
  })

  return query
}
