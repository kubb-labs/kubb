import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { parseTemplate } from 'url-template'

import type { QueryKey, UseQueryResult, UseQueryOptions } from '@tanstack/react-query'
import type { FindPetsByTagsResponse, FindPetsByTagsPathParams, FindPetsByTagsQueryParams } from '../models/ts/FindPetsByTags'

export const findPetsByTagsQueryKey = (pathParams?: FindPetsByTagsPathParams, queryParams?: FindPetsByTagsQueryParams) =>
  ['/pet/findByTags', ...(pathParams ? [pathParams] : []), ...(queryParams ? [queryParams] : [])] as const

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags
 */
export const useFindPetsByTags = <TData = FindPetsByTagsResponse>(
  pathParams: FindPetsByTagsPathParams,
  queryParams: FindPetsByTagsQueryParams,
  options?: { query?: UseQueryOptions<TData> }
): UseQueryResult<TData> & { queryKey: QueryKey } => {
  const { query: queryOptions } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? findPetsByTagsQueryKey(pathParams, queryParams)

  const query = useQuery<TData>({
    queryKey,
    queryFn: () => {
      const template = parseTemplate('/pet/findByTags').expand(pathParams as any)
      return axios.get(template).then((res) => res.data)
    },
    ...queryOptions,
  }) as UseQueryResult<TData> & { queryKey: QueryKey }

  query.queryKey = queryKey

  return query
}
