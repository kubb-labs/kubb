import client from '@kubb/swagger-client/client'
import { useQuery, queryOptions } from '@tanstack/vue-query'
import { unref } from 'vue'
import type { FindPetsByTagsQueryResponse, FindPetsByTagsQueryParams, FindPetsByTags400 } from '../models/FindPetsByTags'
import type { QueryObserverOptions, UseQueryReturnType, QueryKey } from '@tanstack/vue-query'
import type { MaybeRef } from 'vue'

type FindPetsByTagsClient = typeof client<FindPetsByTagsQueryResponse, FindPetsByTags400, never>
type FindPetsByTags = {
  data: FindPetsByTagsQueryResponse
  error: FindPetsByTags400
  request: never
  pathParams: never
  queryParams: FindPetsByTagsQueryParams
  headerParams: never
  response: FindPetsByTagsQueryResponse
  client: {
    parameters: Partial<Parameters<FindPetsByTagsClient>[0]>
    return: Awaited<ReturnType<FindPetsByTagsClient>>
  }
}
export const findPetsByTagsQueryKey = (params?: MaybeRef<FindPetsByTags['queryParams']>) => [{ url: '/pet/findByTags' }, ...(params ? [params] : [])] as const
export type FindPetsByTagsQueryKey = ReturnType<typeof findPetsByTagsQueryKey>
export function findPetsByTagsQueryOptions(refParams?: MaybeRef<FindPetsByTagsQueryParams>, options: FindPetsByTags['client']['parameters'] = {}) {
  const queryKey = findPetsByTagsQueryKey(refParams)
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const params = unref(refParams)
      const res = await client<FindPetsByTags['data'], FindPetsByTags['error']>({
        method: 'get',
        url: '/pet/findByTags',
        params,
        ...options,
      })
      return res.data
    },
  })
}
/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags
 */
export function useFindPetsByTags<
  TData = FindPetsByTags['response'],
  TQueryData = FindPetsByTags['response'],
  TQueryKey extends QueryKey = FindPetsByTagsQueryKey,
>(
  refParams?: MaybeRef<FindPetsByTagsQueryParams>,
  options: {
    query?: Partial<QueryObserverOptions<FindPetsByTags['response'], FindPetsByTags['error'], TData, TQueryKey>>
    client?: FindPetsByTags['client']['parameters']
  } = {},
): UseQueryReturnType<TData, FindPetsByTags['error']> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? findPetsByTagsQueryKey(refParams)
  const query = useQuery({
    ...(findPetsByTagsQueryOptions(refParams, clientOptions) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, 'queryKey'>),
  }) as UseQueryReturnType<TData, FindPetsByTags['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
