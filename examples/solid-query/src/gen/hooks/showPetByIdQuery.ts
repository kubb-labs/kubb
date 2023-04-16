import { createQuery } from '@tanstack/solid-query'

import client from '@kubb/swagger-client/client'

import type { QueryKey, CreateQueryResult, CreateQueryOptions } from '@tanstack/solid-query'
import type { ShowPetByIdResponse, ShowPetByIdPathParams } from '../models/ShowPetById'

export const showPetByIdQueryKey = (petId: ShowPetByIdPathParams['petId'], testId: ShowPetByIdPathParams['testId']) => [`/pets/${petId}`] as const

export function showPetByIdQueryOptions<TData = ShowPetByIdResponse, TError = unknown>(
  petId: ShowPetByIdPathParams['petId'],
  testId: ShowPetByIdPathParams['testId']
): CreateQueryOptions<TData, TError> {
  const queryKey = () => showPetByIdQueryKey(petId, testId)

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
 * @link /pets/:petId
 */
export function showPetByIdQuery<TData = ShowPetByIdResponse, TError = unknown>(
  petId: ShowPetByIdPathParams['petId'],
  testId: ShowPetByIdPathParams['testId'],
  options?: { query?: CreateQueryOptions<TData, TError> }
): CreateQueryResult<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions } = options ?? {}
  const queryKey = queryOptions?.queryKey?.() ?? showPetByIdQueryKey(petId, testId)

  const query = createQuery<TData, TError>({
    ...showPetByIdQueryOptions<TData, TError>(petId, testId),
    ...queryOptions,
  }) as CreateQueryResult<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey as QueryKey

  return query
}
