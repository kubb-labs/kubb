import type { QueryKey, CreateQueryResult, CreateQueryOptions } from '@tanstack/svelte-query'
import { createQuery } from '@tanstack/svelte-query'
import client from '@kubb/swagger-client/client'
import type { ListPetsQueryResponse, ListPetsQueryParams } from '../models/ListPets'

export const listPetsQueryKey = (params?: ListPetsQueryParams) => [`/pets`, ...(params ? [params] : [])] as const

export function listPetsQueryOptions<TData = ListPetsQueryResponse, TError = unknown>(params?: ListPetsQueryParams): CreateQueryOptions<TData, TError> {
  const queryKey = listPetsQueryKey(params)

  return {
    queryKey,
    queryFn: () => {
      return client<TData, TError>({
        method: 'get',
        url: `/pets`,
        params,
      })
    },
  }
}

/**
 * @summary List all pets
 * @link /pets
 */
export function listPetsQuery<TData = ListPetsQueryResponse, TError = unknown>(
  params?: ListPetsQueryParams,
  options?: { query?: CreateQueryOptions<TData, TError> }
): CreateQueryResult<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? listPetsQueryKey(params)

  const query = createQuery<TData, TError>({
    ...listPetsQueryOptions<TData, TError>(params),
    ...queryOptions,
  }) as CreateQueryResult<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey

  return query
}
