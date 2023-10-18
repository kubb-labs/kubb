import { unref } from 'vue'
import type { MaybeRef } from 'vue'
import type { QueryKey, UseQueryReturnType, UseQueryOptions } from '@tanstack/vue-query'
import { useQuery } from '@tanstack/vue-query'
import client from '@kubb/swagger-client/client'
import type { FindPetsByTagsQueryResponse, FindPetsByTagsQueryParams, FindPetsByTags400 } from '../models/FindPetsByTags'

export const findPetsByTagsQueryKey = (params?: MaybeRef<FindPetsByTagsQueryParams>) => [{ url: `/pet/findByTags` }, ...(params ? [params] : [])] as const
export function findPetsByTagsQueryOptions<TData = FindPetsByTagsQueryResponse, TError = FindPetsByTags400>(
  refParams?: MaybeRef<FindPetsByTagsQueryParams>,
  options: Partial<Parameters<typeof client>[0]> = {},
): UseQueryOptions<TData, TError> {
  const queryKey = findPetsByTagsQueryKey(refParams)

  return {
    queryKey,
    queryFn: () => {
      const params = unref(refParams)
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

export function useFindPetsByTags<TData = FindPetsByTagsQueryResponse, TError = FindPetsByTags400>(
  refParams?: MaybeRef<FindPetsByTagsQueryParams>,
  options: {
    query?: UseQueryOptions<TData, TError>
    client?: Partial<Parameters<typeof client<TData, TError>>[0]>
  } = {},
): UseQueryReturnType<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? findPetsByTagsQueryKey(refParams)

  const query = useQuery<TData, TError>({
    ...findPetsByTagsQueryOptions<TData, TError>(refParams, clientOptions),
    ...queryOptions,
  }) as UseQueryReturnType<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey as QueryKey

  return query
}
