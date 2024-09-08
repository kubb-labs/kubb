import client from '@kubb/plugin-client/client'
import type { RequestConfig } from '@kubb/plugin-client/client'
import type { QueryKey, QueryObserverOptions, UseQueryResult } from '@tanstack/react-query'
import { useQuery, queryOptions } from '@tanstack/react-query'

export const findPetsByTagsQueryKey = (params?: FindPetsByTagsQueryParams) => [test, { url: '/pet/findByTags' }, ...(params ? [params] : [])] as const

export type FindPetsByTagsQueryKey = ReturnType<typeof findPetsByTagsQueryKey>

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags
 */
export function findPetsByTags<
  TData = FindPetsByTagsQueryResponse,
  TQueryData = FindPetsByTagsQueryResponse,
  TQueryKey extends QueryKey = FindPetsByTagsQueryKey,
>(
  headers: FindPetsByTagsHeaderParams,
  params?: FindPetsByTagsQueryParams,
  options: {
    query?: Partial<QueryObserverOptions<FindPetsByTagsQueryResponse, FindPetsByTags400, TData, TQueryData, TQueryKey>>
    client?: Partial<RequestConfig>
  } = {},
) {
  const { query: queryOptions, client: config = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? findPetsByTagsQueryKey(params)
  const query = useQuery({
    ...(findPetsByTagsQueryOptions(headers, params, config) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, 'queryKey'>),
  }) as UseQueryResult<TData, FindPetsByTags400> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}

export function findPetsByTagsQueryOptions(headers: FindPetsByTagsHeaderParams, params?: FindPetsByTagsQueryParams, config: Partial<RequestConfig> = {}) {
  const queryKey = findPetsByTagsQueryKey(params)
  return queryOptions({
    queryKey,
    queryFn: async () => {
      return findPetsByTags(headers, params, config)
    },
  })
}
