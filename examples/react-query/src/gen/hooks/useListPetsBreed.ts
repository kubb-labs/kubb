import { useQuery } from '@tanstack/react-query'

import client from '@kubb/swagger-client/client'

import type { QueryKey, UseQueryResult, UseQueryOptions, QueryOptions } from '@tanstack/react-query'
import type { ListPetsBreedResponse, ListPetsBreedPathParams, ListPetsBreedQueryParams } from '../models/ListPetsBreed'

export const listPetsBreedQueryKey = (breed: ListPetsBreedPathParams['breed'], params?: ListPetsBreedQueryParams) =>
  [`/pets/${breed}`, ...(params ? [params] : [])] as const

export function listPetsBreedQueryOptions<TData = ListPetsBreedResponse, TError = unknown>(
  breed: ListPetsBreedPathParams['breed'],
  params?: ListPetsBreedQueryParams
): QueryOptions<TData, TError> {
  const queryKey = listPetsBreedQueryKey(breed, params)

  return {
    queryKey,
    queryFn: () => {
      return client<TData, TError>({
        method: 'get',
        url: `/pets/${breed}`,
        params,
      })
    },
  }
}

/**
 * @summary List all pets with breed
 * @link /pets/:breed
 */
export function useListPetsBreed<TData = ListPetsBreedResponse, TError = unknown>(
  breed: ListPetsBreedPathParams['breed'],
  params?: ListPetsBreedQueryParams,
  options?: { query?: UseQueryOptions<TData, TError> }
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? listPetsBreedQueryKey(breed, params)

  const query = useQuery<TData, TError>({
    ...listPetsBreedQueryOptions<TData, TError>(breed, params),
    ...queryOptions,
  }) as UseQueryResult<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey as QueryKey

  return query
}
