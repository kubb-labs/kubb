import { useQuery } from '@tanstack/react-query'

import client from '../../../client'

import type { QueryKey, UseQueryResult, UseQueryOptions, QueryOptions } from '@tanstack/react-query'
import type { GetPetByIdResponse, GetPetByIdPathParams, GetPetByIdQueryParams } from '../../models/ts/GetPetById'

export const getPetByIdQueryKey = (petId: GetPetByIdPathParams['petId'], params?: GetPetByIdQueryParams) =>
  [`/pet/${petId}`, ...(params ? [params] : [])] as const

export function getPetByIdQueryOptions<TData = GetPetByIdResponse>(petId: GetPetByIdPathParams['petId'], params?: GetPetByIdQueryParams): QueryOptions<TData> {
  const queryKey = getPetByIdQueryKey(petId, params)

  return {
    queryKey,
    queryFn: () => {
      return client<TData>({
        method: 'get',
        url: `/pet/${petId}`,
        params,
      })
    },
  }
}

/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * @link /pet/{petId}
 * @deprecated
 */
export function useGetPetById<TData = GetPetByIdResponse>(
  petId: GetPetByIdPathParams['petId'],
  params?: GetPetByIdQueryParams,
  options?: { query?: UseQueryOptions<TData> }
): UseQueryResult<TData> & { queryKey: QueryKey } {
  const { query: queryOptions } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getPetByIdQueryKey(petId, params)

  const query = useQuery<TData>({
    ...getPetByIdQueryOptions<TData>(petId, params),
    ...queryOptions,
  }) as UseQueryResult<TData> & { queryKey: QueryKey }

  query.queryKey = queryKey

  return query
}
