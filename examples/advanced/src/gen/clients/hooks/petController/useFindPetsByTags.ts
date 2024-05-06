import { findPetsByTagsQueryResponseSchema } from '../../../zod/petController/findPetsByTagsSchema'
import client from '../../../../tanstack-query-client.ts'
import { useQuery, useInfiniteQuery } from '../../../../tanstack-query-hook.ts'
import type {
  FindPetsByTagsQueryResponse,
  FindPetsByTagsQueryParams,
  FindPetsByTagsHeaderParams,
  FindPetsByTags400,
} from '../../../models/ts/petController/FindPetsByTags'
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
  headerParams: FindPetsByTagsHeaderParams
  response: Awaited<ReturnType<FindPetsByTagsClient>>
  client: {
    parameters: Partial<Parameters<FindPetsByTagsClient>[0]>
    return: Awaited<ReturnType<FindPetsByTagsClient>>
  }
}
export const findPetsByTagsQueryKey = (params?: FindPetsByTags['queryParams']) => [{ url: '/pet/findByTags' }, ...(params ? [params] : [])] as const
export type FindPetsByTagsQueryKey = ReturnType<typeof findPetsByTagsQueryKey>
export function findPetsByTagsQueryOptions<TData = FindPetsByTags['response'], TQueryData = FindPetsByTags['response']>(
  headers: FindPetsByTags['headerParams'],
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
        headers: { ...headers, ...options.headers },
        ...options,
      })
      return { ...res, data: findPetsByTagsQueryResponseSchema.parse(res.data) }
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
  headers: FindPetsByTags['headerParams'],
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
    ...findPetsByTagsQueryOptions<TData, TQueryData>(headers, params, clientOptions),
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
  headers: FindPetsByTags['headerParams'],
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
        headers: { ...headers, ...options.headers },
        ...options,
        params: {
          ...params,
          ['test']: pageParam,
          ...(options.params || {}),
        },
      })
      return { ...res, data: findPetsByTagsQueryResponseSchema.parse(res.data) }
    },
  }
}
/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags
 */
export function useFindPetsByTagsInfinite<
  TData = InfiniteData<FindPetsByTags['response']>,
  TQueryData = FindPetsByTags['response'],
  TQueryKey extends QueryKey = FindPetsByTagsInfiniteQueryKey,
>(
  headers: FindPetsByTags['headerParams'],
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
    ...findPetsByTagsInfiniteQueryOptions<TData, TQueryData>(headers, params, clientOptions),
    queryKey,
    ...queryOptions,
  }) as UseInfiniteQueryResult<TData, FindPetsByTags['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
