import { useQuery } from '@tanstack/react-query'

import client from '@kubb/swagger-client/client'

import type { QueryKey, UseQueryResult, UseQueryOptions, QueryOptions } from '@tanstack/react-query'
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
): UseQueryResult<TData> & { queryKey: QueryKey } {
  const { query: queryOptions } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? listPetsQueryKey(params)

  const query = useQuery<TData>({
    ...listPetsQueryOptions<TData>(params),
    ...queryOptions,
  }) as UseQueryResult<TData> & { queryKey: QueryKey }

  query.queryKey = queryKey

  return query
}
