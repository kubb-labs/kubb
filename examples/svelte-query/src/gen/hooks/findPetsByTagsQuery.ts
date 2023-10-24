import client from '@kubb/swagger-client/client'

import { createQuery } from '@tanstack/svelte-query'

import type { CreateQueryOptions, CreateQueryResult, QueryKey } from '@tanstack/svelte-query'
import type { FindPetsByTags400, FindPetsByTagsQueryParams, FindPetsByTagsQueryResponse } from '../models/FindPetsByTags'

export const findPetsByTagsQueryKey = (params?: FindPetsByTagsQueryParams) => [{ url: `/pet/findByTags` }, ...(params ? [params] : [])] as const
export function findPetsByTagsQueryOptions<TData = FindPetsByTagsQueryResponse, TError = FindPetsByTags400>(
  params?: FindPetsByTagsQueryParams,
  options: Partial<Parameters<typeof client>[0]> = {},
): CreateQueryOptions<TData, TError> {
  const queryKey = findPetsByTagsQueryKey(params)
  return {
    queryKey,
    queryFn: () => {
      return client<TData, TError>({
        method: 'get',
        url: `/pet/findByTags`,
        params,
        ...options,
      }).then((res) => res.data)
    },
  }
}
/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags
 */
export function findPetsByTagsQuery<TData = FindPetsByTagsQueryResponse, TError = FindPetsByTags400>(
  params?: FindPetsByTagsQueryParams,
  options: {
    query?: CreateQueryOptions<TData, TError>
    client?: Partial<Parameters<typeof client<TData, TError>>[0]>
  } = {},
): CreateQueryResult<TData, TError> & {
  queryKey: QueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? findPetsByTagsQueryKey(params)
  const query = createQuery<TData, TError>({
    ...findPetsByTagsQueryOptions<TData, TError>(params, clientOptions),
    ...queryOptions,
  }) as CreateQueryResult<TData, TError> & {
    queryKey: QueryKey
  }
  query.queryKey = queryKey
  return query
}
