import type { QueryKey, QueryObserverOptions, UseQueryReturnType } from '@tanstack/react-query'
import type { RequestConfig, ResponseErrorConfig } from 'axios'
import type { MaybeRef } from 'vue'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { unref } from 'vue'

export const findPetsByTagsQueryKey = (params?: MaybeRef<FindPetsByTagsQueryParams>) => [{ url: '/pet/findByTags' }, ...(params ? [params] : [])] as const

export type FindPetsByTagsQueryKey = ReturnType<typeof findPetsByTagsQueryKey>

export function findPetsByTagsQueryOptions(
  headers: MaybeRef<FindPetsByTagsQueryParams>,
  params?: MaybeRef<FindPetsByTagsQueryParams>,
  config: Partial<RequestConfig> = {},
) {
  const queryKey = findPetsByTagsQueryKey(params)
  return queryOptions<FindPetsByTagsQueryResponse, ResponseErrorConfig<FindPetsByTags400>, FindPetsByTagsQueryResponse, typeof queryKey>({
    queryKey,
    queryFn: async ({ signal }) => {
      config.signal = signal
      return findPetsByTags(unref(headers), unref(params), unref(config))
    },
  })
}

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * {@link /pet/findByTags}
 */
export function useFindPetsByTags<
  TData = FindPetsByTagsQueryResponse,
  TQueryData = FindPetsByTagsQueryResponse,
  TQueryKey extends QueryKey = FindPetsByTagsQueryKey,
>(
  headers: MaybeRef<FindPetsByTagsHeaderParams>,
  params?: MaybeRef<FindPetsByTagsQueryParams>,
  options: {
    query?: Partial<QueryObserverOptions<FindPetsByTagsQueryResponse, ResponseErrorConfig<FindPetsByTags400>, TData, TQueryData, TQueryKey>>
    client?: Partial<RequestConfig>
  } = {},
) {
  const { query: queryOptions, client: config = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? findPetsByTagsQueryKey(params)

  const query = useQuery({
    ...(findPetsByTagsQueryOptions(headers, params, config) as unknown as QueryObserverOptions),
    queryKey: queryKey as QueryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, 'queryKey'>),
  }) as UseQueryReturnType<TData, ResponseErrorConfig<FindPetsByTags400>> & { queryKey: TQueryKey }

  query.queryKey = queryKey as TQueryKey

  return query
}
