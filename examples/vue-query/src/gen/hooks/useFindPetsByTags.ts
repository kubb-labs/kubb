import client from '@kubb/plugin-client/clients/axios'
import type { FindPetsByTagsQueryResponse, FindPetsByTagsQueryParams, FindPetsByTags400 } from '../models/FindPetsByTags.ts'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { QueryKey, QueryObserverOptions, UseQueryReturnType } from '@tanstack/vue-query'
import type { MaybeRef } from 'vue'
import { queryOptions, useQuery } from '@tanstack/vue-query'
import { unref } from 'vue'

export const findPetsByTagsQueryKey = (params?: MaybeRef<FindPetsByTagsQueryParams>) => [{ url: '/pet/findByTags' }, ...(params ? [params] : [])] as const

export type FindPetsByTagsQueryKey = ReturnType<typeof findPetsByTagsQueryKey>

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * {@link /pet/findByTags}
 */
async function findPetsByTags({ params }: { params?: FindPetsByTagsQueryParams }, config: Partial<RequestConfig> = {}) {
  const res = await client<FindPetsByTagsQueryResponse, ResponseErrorConfig<FindPetsByTags400>, unknown>({
    method: 'GET',
    url: '/pet/findByTags',
    params,
    ...config,
  })
  return res.data
}

export function findPetsByTagsQueryOptions({ params }: { params?: MaybeRef<FindPetsByTagsQueryParams> }, config: Partial<RequestConfig> = {}) {
  const queryKey = findPetsByTagsQueryKey(params)
  return queryOptions<FindPetsByTagsQueryResponse, ResponseErrorConfig<FindPetsByTags400>, FindPetsByTagsQueryResponse, typeof queryKey>({
    queryKey,
    queryFn: async ({ signal }) => {
      config.signal = signal
      return findPetsByTags(unref({ params: unref(params) }), unref(config))
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
  { params }: { params?: MaybeRef<FindPetsByTagsQueryParams> },
  options: {
    query?: Partial<QueryObserverOptions<FindPetsByTagsQueryResponse, ResponseErrorConfig<FindPetsByTags400>, TData, TQueryData, TQueryKey>>
    client?: Partial<RequestConfig>
  } = {},
) {
  const { query: queryOptions, client: config = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? findPetsByTagsQueryKey(params)

  const query = useQuery({
    ...(findPetsByTagsQueryOptions({ params }, config) as unknown as QueryObserverOptions),
    queryKey: queryKey as QueryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, 'queryKey'>),
  }) as UseQueryReturnType<TData, ResponseErrorConfig<FindPetsByTags400>> & { queryKey: TQueryKey }

  query.queryKey = queryKey as TQueryKey

  return query
}
