import client from '@kubb/plugin-client/client'
import { useQuery, queryOptions } from '@tanstack/react-query'
import type { FindPetsByTagsQueryResponse, FindPetsByTagsQueryParams, FindPetsByTags400 } from '../models/FindPetsByTags'
import type { QueryKey, QueryObserverOptions, UseQueryResult } from '@tanstack/react-query'

type FindPetsByTagsClient = typeof client<FindPetsByTagsQueryResponse, FindPetsByTags400, never>
type FindPetsByTags = {
  data: FindPetsByTagsQueryResponse
  error: FindPetsByTags400
  request: never
  pathParams: never
  queryParams: FindPetsByTagsQueryParams
  headerParams: never
  response: Awaited<ReturnType<FindPetsByTagsClient>>
  client: {
    parameters: Partial<Parameters<FindPetsByTagsClient>[0]>
    return: Awaited<ReturnType<FindPetsByTagsClient>>
  }
}
export function useFindPetsByTagsQueryOptions(params?: FindPetsByTags['queryParams'], options: FindPetsByTags['client']['parameters'] = {}) {
  const queryKey = useFindPetsByTagsQueryKey(params)
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<FindPetsByTags['data'], FindPetsByTags['error']>({
        method: 'get',
        url: '/pet/findByTags',
        ...options,
      })
      return res
    },
  })
}
export const useFindPetsByTagsQueryKey = (params?: FindPetsByTags['queryParams']) => ['v5', { url: '/pet/findByTags' }, ...(params ? [params] : [])] as const
export type FindPetsByTagsQueryKey = ReturnType<typeof useFindPetsByTagsQueryKey>
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
  params?: FindPetsByTags['queryParams'],
  options: {
    query?: Partial<QueryObserverOptions<FindPetsByTags['response'], FindPetsByTags['error'], TData, TQueryData, TQueryKey>>
    client?: FindPetsByTags['client']['parameters']
  } = {},
): UseQueryResult<TData, FindPetsByTags['error']> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? useFindPetsByTagsQueryKey(params)
  const query = useQuery({
    ...(useFindPetsByTagsQueryOptions(params, clientOptions) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, 'queryKey'>),
  }) as UseQueryResult<TData, FindPetsByTags['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
