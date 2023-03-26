import { createQuery } from '@tanstack/svelte-query'

import client from '@kubb/swagger-client/client'

import type { QueryKey, CreateQueryResult, CreateQueryOptions } from '@tanstack/svelte-query'
import type { ShowPetByIdResponse, ShowPetByIdPathParams } from '../models/ShowPetById'

export const showPetByIdQueryKey = (petId: ShowPetByIdPathParams['petId'], testId: ShowPetByIdPathParams['testId']) => [`/pets/${petId}`] as const

export function showPetByIdQueryOptions<TData = ShowPetByIdResponse>(
  petId: ShowPetByIdPathParams['petId'],
  testId: ShowPetByIdPathParams['testId']
): CreateQueryOptions<TData> {
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
export function showPetByIdQuery<TData = ShowPetByIdResponse>(
  petId: ShowPetByIdPathParams['petId'],
  testId: ShowPetByIdPathParams['testId'],
  options?: { query?: CreateQueryOptions<TData> }
): CreateQueryResult<TData, unknown> & { queryKey: QueryKey } {
  const { query: queryOptions } = options ?? {}
  const queryKey = (queryOptions?.queryKey as QueryKey) ?? showPetByIdQueryKey(petId, testId)

  const query = createQuery<TData>({
    ...showPetByIdQueryOptions<TData>(petId, testId),
    ...queryOptions,
  }) as CreateQueryResult<TData, unknown> & { queryKey: QueryKey }

  query.queryKey = queryKey

  return query
}
