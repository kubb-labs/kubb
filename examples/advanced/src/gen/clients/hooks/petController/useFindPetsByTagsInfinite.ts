import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { InfiniteData, QueryKey, QueryClient, InfiniteQueryObserverOptions, UseInfiniteQueryResult } from '../../../../tanstack-query-hook'
import type {
  FindPetsByTagsQueryResponse,
  FindPetsByTagsQueryParams,
  FindPetsByTagsHeaderParams,
  FindPetsByTags400,
} from '../../../models/ts/petController/FindPetsByTags.ts'
import { infiniteQueryOptions, useInfiniteQuery } from '../../../../tanstack-query-hook'
import { findPetsByTags } from '../../axios/petService/findPetsByTags.ts'

export const findPetsByTagsInfiniteQueryKey = (params?: FindPetsByTagsQueryParams) => [{ url: '/pet/findByTags' }, ...(params ? [params] : [])] as const

export type FindPetsByTagsInfiniteQueryKey = ReturnType<typeof findPetsByTagsInfiniteQueryKey>

export function findPetsByTagsInfiniteQueryOptions(
  { headers, params }: { headers: FindPetsByTagsHeaderParams; params?: FindPetsByTagsQueryParams },
  config: Partial<RequestConfig> & { client?: typeof fetch } = {},
) {
  const queryKey = findPetsByTagsInfiniteQueryKey(params)
  return infiniteQueryOptions<
    ResponseConfig<FindPetsByTagsQueryResponse>,
    ResponseErrorConfig<FindPetsByTags400>,
    ResponseConfig<FindPetsByTagsQueryResponse>,
    typeof queryKey,
    number
  >({
    queryKey,
    queryFn: async ({ signal, pageParam }) => {
      config.signal = signal

      if (!params) {
        params = {}
      }
      params['pageSize'] = pageParam as unknown as FindPetsByTagsQueryParams['pageSize']
      return findPetsByTags({ headers, params }, config)
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => (Array.isArray(lastPage.data) && lastPage.data.length === 0 ? undefined : lastPageParam + 1),
    getPreviousPageParam: (_firstPage, _allPages, firstPageParam) => (firstPageParam <= 1 ? undefined : firstPageParam - 1),
  })
}

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * {@link /pet/findByTags}
 */
export function useFindPetsByTagsInfinite<
  TData = InfiniteData<ResponseConfig<FindPetsByTagsQueryResponse>>,
  TQueryData = ResponseConfig<FindPetsByTagsQueryResponse>,
  TQueryKey extends QueryKey = FindPetsByTagsInfiniteQueryKey,
>(
  { headers, params }: { headers: FindPetsByTagsHeaderParams; params?: FindPetsByTagsQueryParams },
  options: {
    query?: Partial<
      InfiniteQueryObserverOptions<ResponseConfig<FindPetsByTagsQueryResponse>, ResponseErrorConfig<FindPetsByTags400>, TQueryData, TQueryKey, TQueryData>
    > & { client?: QueryClient }
    client?: Partial<RequestConfig> & { client?: typeof fetch }
  } = {},
) {
  const { query: queryConfig = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...queryOptions } = queryConfig
  const queryKey = queryOptions?.queryKey ?? findPetsByTagsInfiniteQueryKey(params)

  const query = useInfiniteQuery(
    {
      ...findPetsByTagsInfiniteQueryOptions({ headers, params }, config),
      queryKey,
      ...queryOptions,
    } as unknown as InfiniteQueryObserverOptions,
    queryClient,
  ) as UseInfiniteQueryResult<TData, ResponseErrorConfig<FindPetsByTags400>> & { queryKey: TQueryKey }

  query.queryKey = queryKey as TQueryKey

  return query
}
