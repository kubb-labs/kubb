import { createQuery } from '@tanstack/svelte-query'

import client from '@kubb/swagger-client/client'

import type { QueryKey, CreateQueryResult, CreateQueryOptions } from '@tanstack/svelte-query'
import type { ListPetsBreedResponse, ListPetsBreedPathParams, ListPetsBreedQueryParams } from '../models/ListPetsBreed'

export const listPetsBreedQueryKey = (breed: ListPetsBreedPathParams['breed'], params?: ListPetsBreedQueryParams) =>
  [`/pets/${breed}`, ...(params ? [params] : [])] as const

export function listPetsBreedQueryOptions<TData = ListPetsBreedResponse, TError = unknown>(
  breed: ListPetsBreedPathParams['breed'],
  params?: ListPetsBreedQueryParams
): CreateQueryOptions<TData, TError> {
  const queryKey = listPetsBreedQueryKey(breed, params)

  return {
    queryKey,
    queryFn: () => {
      return client<TData>({
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
export function listPetsBreedQuery<TData = ListPetsBreedResponse, TError = unknown>(
  breed: ListPetsBreedPathParams['breed'],
  params?: ListPetsBreedQueryParams,
  options?: { query?: CreateQueryOptions<TData, TError> }
): CreateQueryResult<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? listPetsBreedQueryKey(breed, params)

  const query = createQuery<TData, TError>({
    ...listPetsBreedQueryOptions<TData, TError>(breed, params),
    ...queryOptions,
  }) as CreateQueryResult<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey as QueryKey

  return query
}
