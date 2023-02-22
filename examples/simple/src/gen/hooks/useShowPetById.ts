import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

import type { QueryKey, UseQueryResult, UseQueryOptions } from '@tanstack/react-query'
import type { ShowPetByIdResponse, ShowPetByIdPathParams, ShowPetByIdQueryParams } from '../models/ShowPetById'

export const showPetByIdQueryKey = (petId: ShowPetByIdPathParams['petId'], testId: ShowPetByIdPathParams['testId'], params?: ShowPetByIdQueryParams) =>
  [`/pets/${petId}`, ...(params ? [params] : [])] as const

/**
 * @summary Info for a specific pet
 * @link /pets/{petId}
 */
export const useShowPetById = <TData = ShowPetByIdResponse>(
  petId: ShowPetByIdPathParams['petId'],
  testId: ShowPetByIdPathParams['testId'],
  params: ShowPetByIdQueryParams,
  options?: { query?: UseQueryOptions<TData> }
): UseQueryResult<TData> & { queryKey: QueryKey } => {
  const { query: queryOptions } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? showPetByIdQueryKey(petId, testId, params)

  const query = useQuery<TData>({
    queryKey,
    queryFn: () => {
      return axios.get(`/pets/${petId}`).then((res) => res.data)
    },
    ...queryOptions,
  }) as UseQueryResult<TData> & { queryKey: QueryKey }

  query.queryKey = queryKey

  return query
}
