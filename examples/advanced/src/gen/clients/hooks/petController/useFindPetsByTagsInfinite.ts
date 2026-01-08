import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { InfiniteData, QueryKey, QueryClient, InfiniteQueryObserverOptions, UseInfiniteQueryResult } from '../../../../tanstack-query-hook'
import type {
  FindPetsByTagsResponseData5,
  FindPetsByTagsQueryParams5,
  FindPetsByTagsHeaderParams5,
  FindPetsByTagsStatus4005,
} from '../../../models/ts/petController/FindPetsByTags.ts'
import { infiniteQueryOptions, useInfiniteQuery } from '../../../../tanstack-query-hook'
import { findPetsByTags } from '../../axios/petService/findPetsByTags.ts'

export const findPetsByTagsInfiniteQueryKey = (params?: FindPetsByTagsQueryParams5) => [{ url: '/pet/findByTags' }, ...(params ? [params] : [])] as const

export type FindPetsByTagsInfiniteQueryKey = ReturnType<typeof findPetsByTagsInfiniteQueryKey>

export function findPetsByTagsInfiniteQueryOptions(
  { headers, params }: { headers: FindPetsByTagsHeaderParams5; params?: FindPetsByTagsQueryParams5 },
  config: Partial<RequestConfig> & { client?: typeof fetch } = {},
) {
  const queryKey = findPetsByTagsInfiniteQueryKey(params)
  return infiniteQueryOptions<
    ResponseConfig<FindPetsByTagsResponseData5>,
    ResponseErrorConfig<FindPetsByTagsStatus4005>,
    InfiniteData<ResponseConfig<FindPetsByTagsResponseData5>>,
    typeof queryKey,
    NonNullable<FindPetsByTagsQueryParams5['pageSize']>
  >({
    queryKey,
    queryFn: async ({ signal, pageParam }) => {
      config.signal = signal

      params = {
        ...(params ?? {}),
        ['pageSize']: pageParam as unknown as FindPetsByTagsQueryParams5['pageSize'],
      } as FindPetsByTagsQueryParams5
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
  TQueryFnData = ResponseConfig<FindPetsByTagsResponseData5>,
  TError = ResponseErrorConfig<FindPetsByTagsStatus4005>,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = FindPetsByTagsInfiniteQueryKey,
  TPageParam = NonNullable<FindPetsByTagsQueryParams5['pageSize']>,
>(
  { headers, params }: { headers: FindPetsByTagsHeaderParams5; params?: FindPetsByTagsQueryParams5 },
  options: {
    query?: Partial<InfiniteQueryObserverOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>> & { client?: QueryClient }
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
    } as unknown as InfiniteQueryObserverOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>,
    queryClient,
  ) as UseInfiniteQueryResult<TData, TError> & { queryKey: TQueryKey }

  query.queryKey = queryKey as TQueryKey

  return query
}
