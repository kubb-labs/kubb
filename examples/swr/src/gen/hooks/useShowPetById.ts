import useSWR from 'swr'

import client from '@kubb/swagger-client/client'

import type { SWRConfiguration, SWRResponse } from 'swr'
import type { ShowPetByIdResponse, ShowPetByIdPathParams } from '../models/ShowPetById'

export function showPetByIdQueryOptions<TData = ShowPetByIdResponse>(
  petId: ShowPetByIdPathParams['petId'],
  testId: ShowPetByIdPathParams['testId']
): SWRConfiguration<TData> {
  return {
    fetcher: () => {
      return client<TData>({
        method: 'get',
        url: `/pets/${petId}`,
      })
    },
  }
}

/**
 * @summary Info for a specific pet
 * @link /pets/{petId}
 */
export function useShowPetById<TData = ShowPetByIdResponse>(
  petId: ShowPetByIdPathParams['petId'],
  testId: ShowPetByIdPathParams['testId'],
  options?: { query?: SWRConfiguration<TData> }
): SWRResponse<TData> {
  const { query: queryOptions } = options ?? {}

  const query = useSWR<TData, unknown, string>(`/pets/${petId}`, {
    ...showPetByIdQueryOptions<TData>(petId, testId),
    ...queryOptions,
  })

  return query
}
