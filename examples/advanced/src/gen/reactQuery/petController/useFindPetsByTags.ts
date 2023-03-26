import { useQuery } from '@tanstack/react-query'

import client from '../../../client'

import type { QueryKey, UseQueryResult, UseQueryOptions, QueryOptions } from '@tanstack/react-query'
import type { FindPetsByTagsResponse, FindPetsByTagsQueryParams } from '../../models/ts/FindPetsByTags'

export const findPetsByTagsQueryKey = (params?: FindPetsByTagsQueryParams) => [`/pet/findByTags`, ...(params ? [params] : [])] as const

export function findPetsByTagsQueryOptions<TData = FindPetsByTagsResponse>(params?: FindPetsByTagsQueryParams): QueryOptions<TData> {
  const queryKey = findPetsByTagsQueryKey(params)

  return {
    queryKey,
    queryFn: () => {
      return client<TData>({
        method: 'get',
        url: `/pet/findByTags`,
        params,
      })
    },
  }
}

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags
 */
export function useFindPetsByTags<TData = FindPetsByTagsResponse>(
  params?: FindPetsByTagsQueryParams,
  options?: { query?: UseQueryOptions<TData> }
): UseQueryResult<TData, unknown> & { queryKey: QueryKey } {
  const { query: queryOptions } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? findPetsByTagsQueryKey(params)

  const query = useQuery<TData>({
    ...findPetsByTagsQueryOptions<TData>(params),
    ...queryOptions,
  }) as UseQueryResult<TData, unknown> & { queryKey: QueryKey }

  query.queryKey = queryKey as QueryKey

  return query
}
