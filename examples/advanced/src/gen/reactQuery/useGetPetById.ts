import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

import type { QueryKey, UseQueryResult, UseQueryOptions } from '@tanstack/react-query'
import type { GetPetByIdResponse, GetPetByIdPathParams, GetPetByIdQueryParams } from '../models/ts/GetPetById'

export const getPetByIdQueryKey = (petId: GetPetByIdPathParams['petId'], params?: GetPetByIdQueryParams) =>
  [`/pet/${petId}`, ...(params ? [params] : [])] as const

/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * @link /pet/{petId}
 */
export const useGetPetById = <TData = GetPetByIdResponse>(
  petId: GetPetByIdPathParams['petId'],
  params: GetPetByIdQueryParams,
  options?: { query?: UseQueryOptions<TData> }
): UseQueryResult<TData> & { queryKey: QueryKey } => {
  const { query: queryOptions } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getPetByIdQueryKey(petId, params)

  const query = useQuery<TData>({
    queryKey,
    queryFn: () => {
      return axios.get(`/pet/${petId}`).then((res) => res.data)
    },
    ...queryOptions,
  }) as UseQueryResult<TData> & { queryKey: QueryKey }

  query.queryKey = queryKey

  return query
}
