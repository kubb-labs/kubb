import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

import type { QueryKey, UseQueryResult, UseQueryOptions, QueryOptions } from '@tanstack/react-query'
import type { FindPetsByTagsResponse, FindPetsByTagsQueryParams } from '../../models/ts/FindPetsByTags'

export const findPetsByTagsQueryKey = (params?: FindPetsByTagsQueryParams) => [`/pet/findByTags`, ...(params ? [params] : [])] as const

export const findPetsByTagsQueryOptions = <TData = FindPetsByTagsResponse>(params?: FindPetsByTagsQueryParams): QueryOptions<TData> => {
  const queryKey = findPetsByTagsQueryKey(params)

  return {
    queryKey,
    queryFn: () => {
      return axios.get(`/pet/findByTags`).then((res) => res.data)
    },
  }
}

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags
 */
export const useFindPetsByTags = <TData = FindPetsByTagsResponse>(
  params?: FindPetsByTagsQueryParams,
  options?: { query?: UseQueryOptions<TData> }
): UseQueryResult<TData> & { queryKey: QueryKey } => {
  const { query: queryOptions } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? findPetsByTagsQueryKey(params)

  const query = useQuery<TData>({
    ...findPetsByTagsQueryOptions<TData>(params),
    ...queryOptions,
  }) as UseQueryResult<TData> & { queryKey: QueryKey }

  query.queryKey = queryKey

  return query
}
