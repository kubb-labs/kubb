import client from '@kubb/plugin-client/clients/axios'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { InfiniteData, QueryKey, InfiniteQueryObserverOptions, UseInfiniteQueryReturnType } from '@tanstack/react-query'
import type { MaybeRef } from 'vue'
import { infiniteQueryOptions, useInfiniteQuery } from '@tanstack/react-query'

export const findPetsByTagsInfiniteQueryKey = (params?: MaybeRef<FindPetsByTagsQueryParams>) =>
  [{ url: '/pet/findByTags' }, ...(params ? [params] : [])] as const

export type FindPetsByTagsInfiniteQueryKey = ReturnType<typeof findPetsByTagsInfiniteQueryKey>

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * {@link /pet/findByTags}
 */
export async function findPetsByTagsInfinite(headers: FindPetsByTagsHeaderParams, params?: FindPetsByTagsQueryParams, config: Partial<RequestConfig> = {}) {
  const res = await client<FindPetsByTagsQueryResponse, ResponseErrorConfig<FindPetsByTags400>, unknown>({
    method: 'GET',
    url: `/pet/findByTags`,
    params,
    headers: { ...headers, ...config.headers },
    ...config,
  })
  return findPetsByTagsQueryResponse.parse(res.data)
}

export function findPetsByTagsInfiniteQueryOptions(
  headers: MaybeRef<FindPetsByTagsHeaderParams>,
  params?: MaybeRef<FindPetsByTagsQueryParams>,
  config: Partial<RequestConfig> = {},
) {
  const queryKey = findPetsByTagsInfiniteQueryKey(params)
  return infiniteQueryOptions<FindPetsByTagsQueryResponse, ResponseErrorConfig<FindPetsByTags400>, FindPetsByTagsQueryResponse, typeof queryKey, number>({
    queryKey,
    queryFn: async ({ signal, pageParam }) => {
      config.signal = signal

      if (params) {
        params['pageSize'] = pageParam as unknown as FindPetsByTagsQueryParams['pageSize']
      }
      return findPetsByTagsInfinite(headers, params, config)
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage['cursor'],
    getPreviousPageParam: (firstPage) => firstPage['cursor'],
  })
}

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * {@link /pet/findByTags}
 */
export function useFindPetsByTagsInfinite<
  TData = InfiniteData<FindPetsByTagsQueryResponse>,
  TQueryData = FindPetsByTagsQueryResponse,
  TQueryKey extends QueryKey = FindPetsByTagsInfiniteQueryKey,
>(
  headers: MaybeRef<FindPetsByTagsHeaderParams>,
  params?: MaybeRef<FindPetsByTagsQueryParams>,
  options: {
    query?: Partial<InfiniteQueryObserverOptions<FindPetsByTagsQueryResponse, ResponseErrorConfig<FindPetsByTags400>, TData, TQueryData, TQueryKey>>
    client?: Partial<RequestConfig>
  } = {},
) {
  const { query: queryOptions, client: config = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? findPetsByTagsInfiniteQueryKey(params)

  const query = useInfiniteQuery({
    ...(findPetsByTagsInfiniteQueryOptions(headers, params, config) as unknown as InfiniteQueryObserverOptions),
    queryKey: queryKey as QueryKey,
    ...(queryOptions as unknown as Omit<InfiniteQueryObserverOptions, 'queryKey'>),
  }) as UseInfiniteQueryReturnType<TData, ResponseErrorConfig<FindPetsByTags400>> & { queryKey: TQueryKey }

  query.queryKey = queryKey as TQueryKey

  return query
}
