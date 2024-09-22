import client from '../../../../tanstack-query-client.ts'
import type { RequestConfig } from '../../../../tanstack-query-client.ts'
import type { QueryKey, InfiniteQueryObserverOptions, UseInfiniteQueryResult } from '../../../../tanstack-query-hook.ts'
import type {
  FindPetsByTagsQueryResponse,
  FindPetsByTagsQueryParams,
  FindPetsByTagsHeaderParams,
  FindPetsByTags400,
} from '../../../models/ts/petController/FindPetsByTags.ts'
import { useInfiniteQuery, infiniteQueryOptions } from '../../../../tanstack-query-hook.ts'
import { findPetsByTagsQueryResponseSchema } from '../../../zod/petController/findPetsByTagsSchema.ts'

export const findPetsByTagsInfiniteQueryKey = (params?: FindPetsByTagsQueryParams) => [{ url: '/pet/findByTags' }, ...(params ? [params] : [])] as const

export type FindPetsByTagsInfiniteQueryKey = ReturnType<typeof findPetsByTagsInfiniteQueryKey>

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags
 */
async function findPetsByTags(headers: FindPetsByTagsHeaderParams, params?: FindPetsByTagsQueryParams, config: Partial<RequestConfig> = {}) {
  const res = await client<FindPetsByTagsQueryResponse, FindPetsByTags400, unknown>({
    method: 'GET',
    url: '/pet/findByTags',
    baseURL: 'https://petstore3.swagger.io/api/v3',
    params,
    headers: { ...headers, ...config.headers },
    ...config,
  })
  return findPetsByTagsQueryResponseSchema.parse(res.data)
}

export function findPetsByTagsInfiniteQueryOptions(
  headers: FindPetsByTagsHeaderParams,
  params?: FindPetsByTagsQueryParams,
  config: Partial<RequestConfig> = {},
) {
  const queryKey = findPetsByTagsInfiniteQueryKey(params)
  return infiniteQueryOptions({
    queryKey,
    queryFn: async ({ pageParam }) => {
      if (params) {
        params['pageSize'] = pageParam as unknown as FindPetsByTagsQueryParams['pageSize']
      }
      return findPetsByTags(headers, params, config)
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => (Array.isArray(lastPage) && lastPage.length === 0 ? undefined : lastPageParam + 1),
    getPreviousPageParam: (_firstPage, _allPages, firstPageParam) => (firstPageParam <= 1 ? undefined : firstPageParam - 1),
  })
}

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags
 */
export function useFindPetsByTagsInfinite<
  TData = FindPetsByTagsQueryResponse,
  TQueryData = FindPetsByTagsQueryResponse,
  TQueryKey extends QueryKey = FindPetsByTagsInfiniteQueryKey,
>(
  headers: FindPetsByTagsHeaderParams,
  params?: FindPetsByTagsQueryParams,
  options: {
    query?: Partial<InfiniteQueryObserverOptions<FindPetsByTagsQueryResponse, FindPetsByTags400, TData, TQueryData, TQueryKey>>
    client?: Partial<RequestConfig>
  } = {},
) {
  const { query: queryOptions, client: config = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? findPetsByTagsInfiniteQueryKey(params)
  const query = useInfiniteQuery({
    ...(findPetsByTagsInfiniteQueryOptions(headers, params, config) as unknown as InfiniteQueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<InfiniteQueryObserverOptions, 'queryKey'>),
  }) as UseInfiniteQueryResult<TData, FindPetsByTags400> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
