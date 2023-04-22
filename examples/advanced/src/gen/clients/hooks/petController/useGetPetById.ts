import { useQuery } from '@tanstack/react-query'

import client from '../../../../client'

import type { QueryKey, UseQueryResult, UseQueryOptions, QueryOptions } from '@tanstack/react-query'
import type { GetPetByIdResponse, GetPetByIdPathParams, GetPetById400, GetPetById404 } from '../../../models/ts/petController/GetPetById'

export const getPetByIdQueryKey = (petId: GetPetByIdPathParams['petId']) => [`/pet/${petId}`] as const

export function getPetByIdQueryOptions<TData = GetPetByIdResponse, TError = GetPetById400 | GetPetById404>(
  petId: GetPetByIdPathParams['petId']
): QueryOptions<TData, TError> {
  const queryKey = getPetByIdQueryKey(petId)

  return {
    queryKey,
    queryFn: () => {
      return client<TData, TError>({
        method: 'get',
        url: `/pet/${petId}`,
      })
    },
  }
}

/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * @link /pet/:petId
 */
export function useGetPetById<TData = GetPetByIdResponse, TError = GetPetById400 | GetPetById404>(
  petId: GetPetByIdPathParams['petId'],
  options?: { query?: UseQueryOptions<TData, TError> }
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getPetByIdQueryKey(petId)

  const query = useQuery<TData, TError>({
    ...getPetByIdQueryOptions<TData, TError>(petId),
    ...queryOptions,
  }) as UseQueryResult<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey as QueryKey

  return query
}
