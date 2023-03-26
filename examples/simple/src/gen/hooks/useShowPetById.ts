import { useQuery } from '@tanstack/react-query'

import client from '@kubb/swagger-client/client'

import type { QueryKey, UseQueryResult, UseQueryOptions, QueryOptions } from '@tanstack/react-query'
import type { ShowPetByIdResponse, ShowPetByIdPathParams } from '../models/ShowPetById'

export const showPetByIdQueryKey = (petId: ShowPetByIdPathParams['petId'], testId: ShowPetByIdPathParams['testId']) => [`/pets/${petId}`] as const

export function showPetByIdQueryOptions<TData = ShowPetByIdResponse>(
  petId: ShowPetByIdPathParams['petId'],
  testId: ShowPetByIdPathParams['testId']
): QueryOptions<TData> {
  const queryKey = showPetByIdQueryKey(petId, testId)

  return {
    queryKey,
    queryFn: () => {
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
  options?: { query?: UseQueryOptions<TData> }
): UseQueryResult<TData, unknown> & { queryKey: QueryKey } {
  const { query: queryOptions } = options ?? {}
  const queryKey = (queryOptions?.queryKey as QueryKey) ?? showPetByIdQueryKey(petId, testId)

  const query = useQuery<TData>({
    ...showPetByIdQueryOptions<TData>(petId, testId),
    ...queryOptions,
  }) as UseQueryResult<TData, unknown> & { queryKey: QueryKey }

  query.queryKey = queryKey

  return query
}
