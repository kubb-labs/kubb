import { useInfiniteQuery, useQuery } from '@tanstack/react-query'

import client from '../../../../tanstack-query-client.ts'

import type { QueryKey, UseInfiniteQueryOptions, UseInfiniteQueryResult, UseQueryOptions, UseQueryResult } from '@tanstack/react-query'
import type { ResponseConfig } from '../../../../tanstack-query-client.ts'
import type { GetPetById400, GetPetByIdPathParams, GetPetByIdQueryResponse } from '../../../models/ts/petController/GetPetById'

export const getPetByIdQueryKey = (petId: GetPetByIdPathParams['petId']) => [{ url: `/pet/${petId}`, params: { petId: petId } }] as const
export function getPetByIdQueryOptions<TData = GetPetByIdQueryResponse, TError = GetPetById400>(
  petId: GetPetByIdPathParams['petId'],
  options: Partial<Parameters<typeof client>[0]> = {},
): UseQueryOptions<ResponseConfig<TData>, TError> {
  const queryKey = getPetByIdQueryKey(petId)

  return {
    queryKey,
    queryFn: () => {
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
 * @link /pet/:petId
 */

export function useGetPetById<TData = GetPetByIdQueryResponse, TError = GetPetById400>(petId: GetPetByIdPathParams['petId'], options: {
  query?: UseQueryOptions<ResponseConfig<TData>, TError>
  client?: Partial<Parameters<typeof client<TData, TError>>[0]>
} = {}): UseQueryResult<ResponseConfig<TData>, TError> & { queryKey: QueryKey } {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getPetByIdQueryKey(petId)

  const query = useQuery<ResponseConfig<TData>, TError>({
    ...getPetByIdQueryOptions<TData, TError>(petId, clientOptions),
    ...queryOptions,
  }) as UseQueryResult<ResponseConfig<TData>, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey

  return query
}

export function getPetByIdQueryOptionsInfinite<TData = GetPetByIdQueryResponse, TError = GetPetById400>(
  petId: GetPetByIdPathParams['petId'],
  options: Partial<Parameters<typeof client>[0]> = {},
): UseInfiniteQueryOptions<ResponseConfig<TData>, TError> {
  const queryKey = getPetByIdQueryKey(petId)

  return {
    queryKey,
    queryFn: ({ pageParam }) => {
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
 * @link /pet/:petId
 */

export function useGetPetByIdInfinite<TData = GetPetByIdQueryResponse, TError = GetPetById400>(petId: GetPetByIdPathParams['petId'], options: {
  query?: UseInfiniteQueryOptions<ResponseConfig<TData>, TError>
  client?: Partial<Parameters<typeof client<TData, TError>>[0]>
} = {}): UseInfiniteQueryResult<ResponseConfig<TData>, TError> & { queryKey: QueryKey } {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getPetByIdQueryKey(petId)

  const query = useInfiniteQuery<ResponseConfig<TData>, TError>({
    ...getPetByIdQueryOptionsInfinite<TData, TError>(petId, clientOptions),
    ...queryOptions,
  }) as UseInfiniteQueryResult<ResponseConfig<TData>, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey

  return query
}
