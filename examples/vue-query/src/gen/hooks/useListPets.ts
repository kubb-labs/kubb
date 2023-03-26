import { useQuery } from '@tanstack/vue-query'

import client from '@kubb/swagger-client/client'

import type { QueryKey, UseQueryReturnType, UseQueryOptions, QueryOptions } from '@tanstack/vue-query'
import type { ListPetsResponse, ListPetsQueryParams } from '../models/ListPets'

export const listPetsQueryKey = (params?: ListPetsQueryParams) => [`/pets`, ...(params ? [params] : [])] as const

export function listPetsQueryOptions<TData = ListPetsResponse>(params?: ListPetsQueryParams): QueryOptions<TData> {
  const queryKey = listPetsQueryKey(params)

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
export function useListPets<TData = ListPetsResponse>(
  params?: ListPetsQueryParams,
  options?: { query?: UseQueryOptions<TData> }
): UseQueryReturnType<TData, unknown> & { queryKey: QueryKey } {
  const { query: queryOptions } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? listPetsQueryKey(params)

  const query = useQuery<TData>({
    ...listPetsQueryOptions<TData>(params),
    ...queryOptions,
  }) as UseQueryReturnType<TData, unknown> & { queryKey: QueryKey }

  query.queryKey = queryKey as QueryKey

  return query
}
