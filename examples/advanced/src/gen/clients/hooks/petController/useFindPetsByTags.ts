import client from '../../../../tanstack-query-client.ts'
import { useQuery, useInfiniteQuery, useSuspenseQuery } from '../../../../tanstack-query-hook.ts'
import { findPetsByTagsQueryResponseSchema } from '../../../zod/petController/findPetsByTagsSchema.ts'
import { queryOptions, infiniteQueryOptions } from '@tanstack/react-query'
import type {
  FindPetsByTagsQueryResponse,
  FindPetsByTagsQueryParams,
  FindPetsByTagsHeaderParams,
  FindPetsByTags400,
} from '../../../models/ts/petController/FindPetsByTags.ts'
import type {
  QueryObserverOptions,
  UseQueryResult,
  QueryKey,
  InfiniteQueryObserverOptions,
  UseInfiniteQueryResult,
  InfiniteData,
  UseSuspenseQueryOptions,
  UseSuspenseQueryResult,
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

export function findPetsByTagsQueryOptions(
  headers: FindPetsByTags['headerParams'],
  params?: FindPetsByTags['queryParams'],
  options: FindPetsByTags['client']['parameters'] = {},
) {
  const queryKey = findPetsByTagsQueryKey(params)
  return queryOptions({
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
  headers: FindPetsByTags['headerParams'],
  params?: FindPetsByTags['queryParams'],
  options: {
    query?: Partial<QueryObserverOptions<FindPetsByTags['response'], FindPetsByTags['error'], TData, TQueryData, TQueryKey>>
    client?: FindPetsByTags['client']['parameters']
  } = {},
): UseQueryResult<TData, FindPetsByTags['error']> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? findPetsByTagsQueryKey(params)
  const query = useQuery({
    ...(findPetsByTagsQueryOptions(headers, params, clientOptions) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, 'queryKey'>),
  }) as UseQueryResult<TData, FindPetsByTags['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}

export const findPetsByTagsInfiniteQueryKey = (params?: FindPetsByTags['queryParams']) => [{ url: '/pet/findByTags' }, ...(params ? [params] : [])] as const

export type FindPetsByTagsInfiniteQueryKey = ReturnType<typeof findPetsByTagsInfiniteQueryKey>

export function findPetsByTagsInfiniteQueryOptions(
  headers: FindPetsByTags['headerParams'],
  params?: FindPetsByTags['queryParams'],
  options: FindPetsByTags['client']['parameters'] = {},
) {
  const queryKey = findPetsByTagsInfiniteQueryKey(params)
  return infiniteQueryOptions({
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
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => (Array.isArray(lastPage.data) && lastPage.data.length === 0 ? undefined : lastPageParam + 1),
    getPreviousPageParam: (_firstPage, _allPages, firstPageParam) => (firstPageParam <= 1 ? undefined : firstPageParam - 1),
  })
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
    query?: Partial<InfiniteQueryObserverOptions<FindPetsByTags['response'], FindPetsByTags['error'], TData, TQueryData, TQueryKey>>
    client?: FindPetsByTags['client']['parameters']
  } = {},
): UseInfiniteQueryResult<TData, FindPetsByTags['error']> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? findPetsByTagsInfiniteQueryKey(params)
  const query = useInfiniteQuery({
    ...(findPetsByTagsInfiniteQueryOptions(headers, params, clientOptions) as unknown as InfiniteQueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<InfiniteQueryObserverOptions, 'queryKey'>),
  }) as UseInfiniteQueryResult<TData, FindPetsByTags['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}

export const findPetsByTagsSuspenseQueryKey = (params?: FindPetsByTags['queryParams']) => [{ url: '/pet/findByTags' }, ...(params ? [params] : [])] as const

export type FindPetsByTagsSuspenseQueryKey = ReturnType<typeof findPetsByTagsSuspenseQueryKey>

export function findPetsByTagsSuspenseQueryOptions(
  headers: FindPetsByTags['headerParams'],
  params?: FindPetsByTags['queryParams'],
  options: FindPetsByTags['client']['parameters'] = {},
) {
  const queryKey = findPetsByTagsSuspenseQueryKey(params)
  return queryOptions({
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
  })
}

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags
 */
export function useFindPetsByTagsSuspense<TData = FindPetsByTags['response'], TQueryKey extends QueryKey = FindPetsByTagsSuspenseQueryKey>(
  headers: FindPetsByTags['headerParams'],
  params?: FindPetsByTags['queryParams'],
  options: {
    query?: Partial<UseSuspenseQueryOptions<FindPetsByTags['response'], FindPetsByTags['error'], TData, TQueryKey>>
    client?: FindPetsByTags['client']['parameters']
  } = {},
): UseSuspenseQueryResult<TData, FindPetsByTags['error']> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? findPetsByTagsSuspenseQueryKey(params)
  const query = useSuspenseQuery({
    ...(findPetsByTagsSuspenseQueryOptions(headers, params, clientOptions) as unknown as UseSuspenseQueryOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<UseSuspenseQueryOptions, 'queryKey'>),
  }) as UseSuspenseQueryResult<TData, FindPetsByTags['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
