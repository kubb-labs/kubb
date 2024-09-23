import client from '@kubb/plugin-client/client'
import type { FindPetsByTagsQueryResponse, FindPetsByTagsQueryParams, FindPetsByTags400 } from '../models/FindPetsByTags.ts'
import type { RequestConfig, ResponseConfig } from '@kubb/plugin-client/client'
import type { QueryKey, UseSuspenseQueryOptions } from '@tanstack/react-query'
import { useSuspenseQuery, queryOptions } from '@tanstack/react-query'

export const findPetsByTagsSuspenseQueryKey = (params?: FindPetsByTagsQueryParams) => ['v5', { url: '/pet/findByTags' }, ...(params ? [params] : [])] as const

export type FindPetsByTagsSuspenseQueryKey = ReturnType<typeof findPetsByTagsSuspenseQueryKey>

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags
 */
async function findPetsByTags(params?: FindPetsByTagsQueryParams, config: Partial<RequestConfig> = {}) {
  const res = await client<FindPetsByTagsQueryResponse, FindPetsByTags400, unknown>({
    method: 'GET',
    url: '/pet/findByTags',
    baseURL: 'https://petstore3.swagger.io/api/v3',
    params,
    ...config,
  })
  return res
}

export function findPetsByTagsSuspenseQueryOptions(params?: FindPetsByTagsQueryParams, config: Partial<RequestConfig> = {}) {
  const queryKey = findPetsByTagsSuspenseQueryKey(params)
  return queryOptions({
    queryKey,
    queryFn: async () => {
      return findPetsByTags(params, config)
    },
  })
}

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags
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
    ...(findPetsByTagsSuspenseQueryOptions(params, config) as unknown as UseSuspenseQueryOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<UseSuspenseQueryOptions, 'queryKey'>),
  }) as ReturnType<typeof query> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
