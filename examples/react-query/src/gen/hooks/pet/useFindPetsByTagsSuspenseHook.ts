import client from '@kubb/plugin-client/clients/axios'
import type { FindPetsByTagsQueryResponse, FindPetsByTagsQueryParams, FindPetsByTags400 } from '../../models/FindPetsByTags.ts'
import type { RequestConfig, ResponseConfig } from '@kubb/plugin-client/clients/axios'
import type { QueryKey, UseSuspenseQueryOptions, UseSuspenseQueryResult } from '@tanstack/react-query'
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query'

export const findPetsByTagsSuspenseQueryKey = (params?: FindPetsByTagsQueryParams) => ['v5', { url: '/pet/findByTags' }, ...(params ? [params] : [])] as const

export type FindPetsByTagsSuspenseQueryKey = ReturnType<typeof findPetsByTagsSuspenseQueryKey>

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * {@link /pet/findByTags}
 */
async function findPetsByTagsHook(params?: FindPetsByTagsQueryParams, config: Partial<RequestConfig> = {}) {
  const res = await client<FindPetsByTagsQueryResponse, FindPetsByTags400, unknown>({ method: 'GET', url: '/pet/findByTags', params, ...config })
  return res
}

export function findPetsByTagsSuspenseQueryOptionsHook(params?: FindPetsByTagsQueryParams, config: Partial<RequestConfig> = {}) {
  const queryKey = findPetsByTagsSuspenseQueryKey(params)
  return queryOptions({
    queryKey,
    queryFn: async ({ signal }) => {
      config.signal = signal
      return findPetsByTagsHook(params, config)
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
    query?: Partial<UseSuspenseQueryOptions<ResponseConfig<FindPetsByTagsQueryResponse>, FindPetsByTags400, TData, TQueryKey>>
    client?: Partial<RequestConfig>
  } = {},
) {
  const { query: queryOptions, client: config = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? findPetsByTagsSuspenseQueryKey(params)

  const query = useSuspenseQuery({
    ...(findPetsByTagsSuspenseQueryOptionsHook(params, config) as unknown as UseSuspenseQueryOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<UseSuspenseQueryOptions, 'queryKey'>),
  }) as UseSuspenseQueryResult<TData, FindPetsByTags400> & { queryKey: TQueryKey }

  query.queryKey = queryKey as TQueryKey

  return query
}
