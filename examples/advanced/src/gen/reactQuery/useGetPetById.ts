import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

import type { QueryKey, UseQueryResult, UseQueryOptions, QueryOptions } from '@tanstack/react-query'
import type { GetPetByIdResponse, GetPetByIdPathParams, GetPetByIdQueryParams } from '../models/ts/GetPetById'

export const getPetByIdQueryKey = (petId: GetPetByIdPathParams['petId'], params?: GetPetByIdQueryParams) =>
  [`/pet/${petId}`, ...(params ? [params] : [])] as const

export const getPetByIdQueryOptions = <TData = GetPetByIdResponse>(
  petId: GetPetByIdPathParams['petId'],
  params?: GetPetByIdQueryParams
): QueryOptions<TData> => {
  const queryKey = getPetByIdQueryKey(petId, params)

  return {
    queryKey,
    queryFn: () => {
      return axios.get(`/pet/${petId}`).then((res) => res.data)
    },
  }
}

/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * @link /pet/{petId}
 */
export const useGetPetById = <TData = GetPetByIdResponse>(
  petId: GetPetByIdPathParams['petId'],
  params?: GetPetByIdQueryParams,
  options?: { query?: UseQueryOptions<TData> }
): UseQueryResult<TData> & { queryKey: QueryKey } => {
  const { query: queryOptions } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getPetByIdQueryKey(petId, params)

  const query = useQuery<TData>({
    ...getPetByIdQueryOptions<TData>(petId, params),
    ...queryOptions,
  }) as UseQueryResult<TData> & { queryKey: QueryKey }

  query.queryKey = queryKey

  return query
}
