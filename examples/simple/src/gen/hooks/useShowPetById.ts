import { useQuery } from '@tanstack/react-query'

import client from '@kubb/swagger-client/client'

import type { QueryKey, UseQueryResult, UseQueryOptions, QueryOptions } from '@tanstack/react-query'
import type { ShowPetByIdResponse, ShowPetByIdPathParams, ShowPetByIdQueryParams } from '../models/ShowPetById'

export const showPetByIdQueryKey = (petId: ShowPetByIdPathParams['petId'], testId: ShowPetByIdPathParams['testId'], params?: ShowPetByIdQueryParams) =>
  [`/pets/${petId}`, ...(params ? [params] : [])] as const

export function showPetByIdQueryOptions<TData = ShowPetByIdResponse>(
  petId: ShowPetByIdPathParams['petId'],
  testId: ShowPetByIdPathParams['testId'],
  params?: ShowPetByIdQueryParams
): QueryOptions<TData> {
  const queryKey = showPetByIdQueryKey(petId, testId, params)

  return {
    queryKey,
    queryFn: () => {
      return client<TData>({
        method: 'get',
        url: `/pets/${petId}`,
        params,
      })
    },
  }
}

/**
 * @summary Info for a specific pet
 * @link /pets/{petId}
 * @deprecated
 */
export function useShowPetById<TData = ShowPetByIdResponse>(
  petId: ShowPetByIdPathParams['petId'],
  testId: ShowPetByIdPathParams['testId'],
  params?: ShowPetByIdQueryParams,
  options?: { query?: UseQueryOptions<TData> }
): UseQueryResult<TData> & { queryKey: QueryKey } {
  const { query: queryOptions } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? showPetByIdQueryKey(petId, testId, params)

  const query = useQuery<TData>({
    ...showPetByIdQueryOptions<TData>(petId, testId, params),
    ...queryOptions,
  }) as UseQueryResult<TData> & { queryKey: QueryKey }

  query.queryKey = queryKey

  return query
}
