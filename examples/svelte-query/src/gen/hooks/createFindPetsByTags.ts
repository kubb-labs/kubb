import client from '@kubb/plugin-client/clients/axios'
import type { FindPetsByTagsQueryResponse, FindPetsByTagsQueryParams, FindPetsByTags400 } from '../models/FindPetsByTags.ts'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '@kubb/plugin-client/clients/axios'
import type { QueryKey, CreateBaseQueryOptions, CreateQueryResult } from '@tanstack/svelte-query'
import { queryOptions, createQuery } from '@tanstack/svelte-query'

export const findPetsByTagsQueryKey = (params?: FindPetsByTagsQueryParams) => [{ url: '/pet/findByTags' }, ...(params ? [params] : [])] as const

export type FindPetsByTagsQueryKey = ReturnType<typeof findPetsByTagsQueryKey>

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * {@link /pet/findByTags}
 */
export async function findPetsByTags(params?: FindPetsByTagsQueryParams, config: Partial<RequestConfig> = {}) {
  const res = await client<FindPetsByTagsQueryResponse, ResponseErrorConfig<FindPetsByTags400>, unknown>({
    method: 'GET',
    url: '/pet/findByTags',
    params,
    ...config,
  })
  return res
}

export function findPetsByTagsQueryOptions(params?: FindPetsByTagsQueryParams, config: Partial<RequestConfig> = {}) {
  const queryKey = findPetsByTagsQueryKey(params)
  return queryOptions<
    ResponseConfig<FindPetsByTagsQueryResponse>,
    ResponseErrorConfig<FindPetsByTags400>,
    ResponseConfig<FindPetsByTagsQueryResponse>,
    typeof queryKey
  >({
    queryKey,
    queryFn: async ({ signal }) => {
      config.signal = signal
      return findPetsByTags(params, config)
    },
  })
}

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * {@link /pet/findByTags}
 */
export function createFindPetsByTags<
  TData = ResponseConfig<FindPetsByTagsQueryResponse>,
  TQueryData = ResponseConfig<FindPetsByTagsQueryResponse>,
  TQueryKey extends QueryKey = FindPetsByTagsQueryKey,
>(
  params?: FindPetsByTagsQueryParams,
  options: {
    query?: Partial<CreateBaseQueryOptions<ResponseConfig<FindPetsByTagsQueryResponse>, ResponseErrorConfig<FindPetsByTags400>, TData, TQueryData, TQueryKey>>
    client?: Partial<RequestConfig>
  } = {},
) {
  const { query: queryOptions, client: config = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? findPetsByTagsQueryKey(params)

  const query = createQuery({
    ...(findPetsByTagsQueryOptions(params, config) as unknown as CreateBaseQueryOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<CreateBaseQueryOptions, 'queryKey'>),
  }) as CreateQueryResult<TData, ResponseErrorConfig<FindPetsByTags400>> & { queryKey: TQueryKey }

  query.queryKey = queryKey as TQueryKey

  return query
}
