import client from '@kubb/plugin-client/client'
import { useQuery } from '@tanstack/vue-query'
import { unref } from 'vue'
import type { FindPetsByTagsQueryResponse, FindPetsByTagsQueryParams, FindPetsByTags400 } from '../models/FindPetsByTags'
import type { UseQueryReturnType, QueryKey, WithRequired } from '@tanstack/vue-query'
import type { VueQueryObserverOptions } from '@tanstack/vue-query/build/lib/types'
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
export function findPetsByTagsQueryOptions<TData = FindPetsByTags['response'], TQueryData = FindPetsByTags['response']>(
  refParams?: MaybeRef<FindPetsByTagsQueryParams>,
  options: FindPetsByTags['client']['parameters'] = {},
): WithRequired<VueQueryObserverOptions<FindPetsByTags['response'], FindPetsByTags['error'], TData, TQueryData>, 'queryKey'> {
  const queryKey = findPetsByTagsQueryKey(refParams)
  return {
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
  }
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
    query?: Partial<VueQueryObserverOptions<FindPetsByTags['response'], FindPetsByTags['error'], TData, TQueryKey>>
    client?: FindPetsByTags['client']['parameters']
  } = {},
): UseQueryReturnType<TData, FindPetsByTags['error']> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? findPetsByTagsQueryKey(refParams)
  const query = useQuery<FindPetsByTags['data'], FindPetsByTags['error'], TData, any>({
    ...findPetsByTagsQueryOptions<TData, TQueryData>(refParams, clientOptions),
    queryKey,
    ...queryOptions,
  }) as UseQueryReturnType<TData, FindPetsByTags['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
