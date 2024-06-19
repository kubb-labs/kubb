import client from '@kubb/swagger-client/client'
import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import type { FindPetsByTagsQueryResponse, FindPetsByTagsQueryParams, FindPetsByTags400 } from '../models/FindPetsByTags'
import type {
  UseBaseQueryOptions,
  UseQueryResult,
  QueryKey,
  WithRequired,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
  InfiniteData,
} from '@tanstack/react-query'

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
export const findPetsByTagsQueryKey = (params?: FindPetsByTags['queryParams']) => [{ url: '/pet/findByTags' }, ...(params ? [params] : [])] as const
export type FindPetsByTagsQueryKey = ReturnType<typeof findPetsByTagsQueryKey>
export function findPetsByTagsQueryOptions<TData = FindPetsByTags['response'], TQueryData = FindPetsByTags['response']>(
  params?: FindPetsByTags['queryParams'],
  options: FindPetsByTags['client']['parameters'] = {},
): WithRequired<UseBaseQueryOptions<FindPetsByTags['response'], FindPetsByTags['error'], TData, TQueryData>, 'queryKey'> {
  const queryKey = findPetsByTagsQueryKey(params)
  return {
    queryKey,
    queryFn: async () => {
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
export function useFindPetsByTagsHook<
  TData = FindPetsByTags['response'],
  TQueryData = FindPetsByTags['response'],
  TQueryKey extends QueryKey = FindPetsByTagsQueryKey,
>(
  params?: FindPetsByTags['queryParams'],
  options: {
    query?: Partial<UseBaseQueryOptions<FindPetsByTags['response'], FindPetsByTags['error'], TData, TQueryData, TQueryKey>>
    client?: FindPetsByTags['client']['parameters']
  } = {},
): UseQueryResult<TData, FindPetsByTags['error']> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? findPetsByTagsQueryKey(params)
  const query = useQuery<FindPetsByTags['data'], FindPetsByTags['error'], TData, any>({
    ...findPetsByTagsQueryOptions<TData, TQueryData>(params, clientOptions),
    queryKey,
    ...queryOptions,
  }) as UseQueryResult<TData, FindPetsByTags['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
export const findPetsByTagsInfiniteQueryKey = (params?: FindPetsByTags['queryParams']) => [{ url: '/pet/findByTags' }, ...(params ? [params] : [])] as const
export type FindPetsByTagsInfiniteQueryKey = ReturnType<typeof findPetsByTagsInfiniteQueryKey>
export function findPetsByTagsInfiniteQueryOptions<TData = FindPetsByTags['response'], TQueryData = FindPetsByTags['response']>(
  params?: FindPetsByTags['queryParams'],
  options: FindPetsByTags['client']['parameters'] = {},
): WithRequired<UseInfiniteQueryOptions<FindPetsByTags['response'], FindPetsByTags['error'], TData, TQueryData>, 'queryKey'> {
  const queryKey = findPetsByTagsInfiniteQueryKey(params)
  return {
    queryKey,
    queryFn: async ({ pageParam }) => {
      const res = await client<FindPetsByTags['data'], FindPetsByTags['error']>({
        method: 'get',
        url: '/pet/findByTags',
        ...options,
        params: {
          ...params,
          ['id']: pageParam,
          ...(options.params || {}),
        },
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
export function useFindPetsByTagsHookInfinite<
  TData = InfiniteData<FindPetsByTags['response']>,
  TQueryData = FindPetsByTags['response'],
  TQueryKey extends QueryKey = FindPetsByTagsInfiniteQueryKey,
>(
  params?: FindPetsByTags['queryParams'],
  options: {
    query?: Partial<UseInfiniteQueryOptions<FindPetsByTags['response'], FindPetsByTags['error'], TData, TQueryData, TQueryKey>>
    client?: FindPetsByTags['client']['parameters']
  } = {},
): UseInfiniteQueryResult<TData, FindPetsByTags['error']> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? findPetsByTagsInfiniteQueryKey(params)
  const query = useInfiniteQuery<FindPetsByTags['data'], FindPetsByTags['error'], TData, any>({
    ...findPetsByTagsInfiniteQueryOptions<TData, TQueryData>(params, clientOptions),
    queryKey,
    ...queryOptions,
  }) as UseInfiniteQueryResult<TData, FindPetsByTags['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
