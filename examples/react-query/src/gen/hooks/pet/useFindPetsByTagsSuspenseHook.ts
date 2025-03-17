import client from '@kubb/plugin-client/clients/axios'
import type { FindPetsByTagsQueryResponse, FindPetsByTagsQueryParams, FindPetsByTags400 } from '../../models/FindPetsByTags.ts'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '@kubb/plugin-client/clients/axios'
import type { QueryKey, UseSuspenseQueryOptions, UseSuspenseQueryResult } from '@tanstack/react-query'
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query'

export const findPetsByTagsSuspenseQueryKey = (params?: FindPetsByTagsQueryParams) => ['v5', { url: '/pet/findByTags' }, ...(params ? [params] : [])] as const

export type FindPetsByTagsSuspenseQueryKey = ReturnType<typeof findPetsByTagsSuspenseQueryKey>

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * {@link /pet/findByTags}
 */
export async function findPetsByTagsSuspenseHook(params?: FindPetsByTagsQueryParams, config: Partial<RequestConfig> & { client?: typeof client } = {}) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<FindPetsByTagsQueryResponse, ResponseErrorConfig<FindPetsByTags400>, unknown>({
    method: 'GET',
    url: '/pet/findByTags',
    params,
    ...requestConfig,
  })
  return res
}

export function findPetsByTagsSuspenseQueryOptionsHook(params?: FindPetsByTagsQueryParams, config: Partial<RequestConfig> & { client?: typeof client } = {}) {
  const queryKey = findPetsByTagsSuspenseQueryKey(params)
  return queryOptions<
    ResponseConfig<FindPetsByTagsQueryResponse>,
    ResponseErrorConfig<FindPetsByTags400>,
    ResponseConfig<FindPetsByTagsQueryResponse>,
    typeof queryKey
  >({
    queryKey,
    queryFn: async ({ signal }) => {
      config.signal = signal
      return findPetsByTagsSuspenseHook(params, config)
    },
  })
}

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * {@link /pet/findByTags}
 */
export function useFindPetsByTagsSuspenseHook<
  TData = ResponseConfig<FindPetsByTagsQueryResponse>,
  TQueryData = ResponseConfig<FindPetsByTagsQueryResponse>,
  TQueryKey extends QueryKey = FindPetsByTagsSuspenseQueryKey,
>(
  params?: FindPetsByTagsQueryParams,
  options: {
    query?: Partial<UseSuspenseQueryOptions<ResponseConfig<FindPetsByTagsQueryResponse>, ResponseErrorConfig<FindPetsByTags400>, TData, TQueryKey>>
    client?: Partial<RequestConfig> & { client?: typeof client }
  } = {},
) {
  const { query: queryOptions, client: config = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? findPetsByTagsSuspenseQueryKey(params)

  const query = useSuspenseQuery({
    ...(findPetsByTagsSuspenseQueryOptionsHook(params, config) as unknown as UseSuspenseQueryOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<UseSuspenseQueryOptions, 'queryKey'>),
  }) as UseSuspenseQueryResult<TData, ResponseErrorConfig<FindPetsByTags400>> & { queryKey: TQueryKey }

  query.queryKey = queryKey as TQueryKey

  return query
}
