import client from '@kubb/plugin-client/client'
import type { FindPetsByTagsQueryResponse, FindPetsByTagsQueryParams, FindPetsByTags400 } from '../models/FindPetsByTags.ts'
import type { RequestConfig, ResponseConfig } from '@kubb/plugin-client/client'
import type { QueryKey, InfiniteQueryObserverOptions, UseInfiniteQueryResult } from '@tanstack/react-query'
import { infiniteQueryOptions, useInfiniteQuery } from '@tanstack/react-query'

export const findPetsByTagsInfiniteQueryKey = (params?: FindPetsByTagsQueryParams) => ['v5', { url: '/pet/findByTags' }, ...(params ? [params] : [])] as const

export type FindPetsByTagsInfiniteQueryKey = ReturnType<typeof findPetsByTagsInfiniteQueryKey>

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags
 */
async function findPetsByTags(params?: FindPetsByTagsQueryParams, config: Partial<RequestConfig> = {}) {
  const res = await client<FindPetsByTagsQueryResponse, FindPetsByTags400, unknown>({ method: 'GET', url: '/pet/findByTags', params, ...config })
  return res
}

export function findPetsByTagsInfiniteQueryOptionsHook(params?: FindPetsByTagsQueryParams, config: Partial<RequestConfig> = {}) {
  const queryKey = findPetsByTagsInfiniteQueryKey(params)
  return infiniteQueryOptions({
    queryKey,
    queryFn: async ({ signal, pageParam }) => {
      config.signal = signal
      if (params) {
        params['pageSize'] = pageParam as unknown as FindPetsByTagsQueryParams['pageSize']
      }
      return findPetsByTags(params, config)
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => (Array.isArray(lastPage.data) && lastPage.data.length === 0 ? undefined : lastPageParam + 1),
    getPreviousPageParam: (_firstPage, _allPages, firstPageParam) => (firstPageParam <= 1 ? undefined : firstPageParam - 1),
  })
}

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags
 */
export function useFindPetsByTagsInfiniteHook<
  TData = ResponseConfig<FindPetsByTagsQueryResponse>,
  TQueryData = ResponseConfig<FindPetsByTagsQueryResponse>,
  TQueryKey extends QueryKey = FindPetsByTagsInfiniteQueryKey,
>(
  params?: FindPetsByTagsQueryParams,
  options: {
    query?: Partial<InfiniteQueryObserverOptions<ResponseConfig<FindPetsByTagsQueryResponse>, FindPetsByTags400, TData, TQueryData, TQueryKey>>
    client?: Partial<RequestConfig>
  } = {},
) {
  const { query: queryOptions, client: config = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? findPetsByTagsInfiniteQueryKey(params)
  const query = useInfiniteQuery({
    ...(findPetsByTagsInfiniteQueryOptionsHook(params, config) as unknown as InfiniteQueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<InfiniteQueryObserverOptions, 'queryKey'>),
  }) as UseInfiniteQueryResult<TData, FindPetsByTags400> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
