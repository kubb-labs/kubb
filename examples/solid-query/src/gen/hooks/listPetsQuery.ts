import { createQuery } from '@tanstack/solid-query'

import client from '@kubb/swagger-client/client'

import type { QueryKey, CreateQueryResult, CreateQueryOptions } from '@tanstack/solid-query'
import type { ListPetsResponse, ListPetsQueryParams } from '../models/ListPets'

export const listPetsQueryKey = (params?: ListPetsQueryParams) => [`/pets`, ...(params ? [params] : [])] as const

export function listPetsQueryOptions<TData = ListPetsResponse>(params?: ListPetsQueryParams): CreateQueryOptions<TData> {
  const queryKey = () => listPetsQueryKey(params)

  return {
    queryKey,
    queryFn: () => {
      return client<TData>({
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
export function listPetsQuery<TData = ListPetsResponse>(
  params?: ListPetsQueryParams,
  options?: { query?: CreateQueryOptions<TData> }
): CreateQueryResult<TData, unknown> & { queryKey: QueryKey } {
  const { query: queryOptions } = options ?? {}
  const queryKey = queryOptions?.queryKey?.() ?? listPetsQueryKey(params)

  const query = createQuery<TData>({
    ...listPetsQueryOptions<TData>(params),
    ...queryOptions,
  }) as CreateQueryResult<TData, unknown> & { queryKey: QueryKey }

  query.queryKey = queryKey as QueryKey

  return query
}
