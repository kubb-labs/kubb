import client from '@kubb/swagger-client/client'
import { useQuery, useInfiniteQuery, useSuspenseQuery } from '@tanstack/react-query'
import type { FindPetsByTagsQueryResponse, FindPetsByTagsQueryParams, FindPetsByTags400 } from '../models/FindPetsByTags'
import type {
  QueryObserverOptions,
  UseQueryResult,
  QueryKey,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
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
  headerParams: never
  response: Awaited<ReturnType<FindPetsByTagsClient>>['data']
  unionResponse: Awaited<ReturnType<FindPetsByTagsClient>> | Awaited<ReturnType<FindPetsByTagsClient>>['data']
  client: {
    paramaters: Partial<Parameters<FindPetsByTagsClient>[0]>
    return: Awaited<ReturnType<FindPetsByTagsClient>>
  }
}
export const findPetsByTagsQueryKey = (params?: FindPetsByTags['queryParams']) => [{ url: '/pet/findByTags' }, ...(params ? [params] : [])] as const
export type FindPetsByTagsQueryKey = ReturnType<typeof findPetsByTagsQueryKey>
export function findPetsByTagsQueryOptions<
  TQueryFnData extends FindPetsByTags['data'] = FindPetsByTags['data'],
  TError = FindPetsByTags['error'],
  TData = FindPetsByTags['response'],
  TQueryData = FindPetsByTags['response'],
>(
  params?: FindPetsByTags['queryParams'],
  options: FindPetsByTags['client']['paramaters'] = {},
): QueryObserverOptions<FindPetsByTags['unionResponse'], TError, TData, TQueryData, FindPetsByTagsQueryKey> {
  const queryKey = findPetsByTagsQueryKey(params)
  return {
    queryKey,
    queryFn: () => {
      return client<TQueryFnData, TError>({
        method: 'get',
        url: `/pet/findByTags`,
        params,
        ...options,
      }).then(res => res?.data || res)
    },
  }
}
/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags */
export function useFindPetsByTagsHook<
  TQueryFnData extends FindPetsByTags['data'] = FindPetsByTags['data'],
  TError = FindPetsByTags['error'],
  TData = FindPetsByTags['response'],
  TQueryData = FindPetsByTags['response'],
  TQueryKey extends QueryKey = FindPetsByTagsQueryKey,
>(params?: FindPetsByTags['queryParams'], options: {
  query?: QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
  client?: FindPetsByTags['client']['paramaters']
} = {}): UseQueryResult<TData, TError> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? findPetsByTagsQueryKey(params)
  const query = useQuery<any, TError, TData, any>({
    ...findPetsByTagsQueryOptions<TQueryFnData, TError, TData, TQueryData>(params, clientOptions),
    queryKey,
    ...queryOptions,
  }) as UseQueryResult<TData, TError> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
export const findPetsByTagsInfiniteQueryKey = (params?: FindPetsByTags['queryParams']) => [{ url: '/pet/findByTags' }, ...(params ? [params] : [])] as const
export type FindPetsByTagsInfiniteQueryKey = ReturnType<typeof findPetsByTagsInfiniteQueryKey>
export function findPetsByTagsInfiniteQueryOptions<
  TQueryFnData extends FindPetsByTags['data'] = FindPetsByTags['data'],
  TError = FindPetsByTags['error'],
  TData = FindPetsByTags['response'],
  TQueryData = FindPetsByTags['response'],
>(
  params?: FindPetsByTags['queryParams'],
  options: FindPetsByTags['client']['paramaters'] = {},
): UseInfiniteQueryOptions<FindPetsByTags['unionResponse'], TError, TData, TQueryData, FindPetsByTagsInfiniteQueryKey> {
  const queryKey = findPetsByTagsInfiniteQueryKey(params)
  return {
    queryKey,
    queryFn: ({ pageParam }) => {
      return client<TQueryFnData, TError>({
        method: 'get',
        url: `/pet/findByTags`,
        ...options,
        params: {
          ...params,
          ['id']: pageParam,
          ...(options.params || {}),
        },
      }).then(res => res?.data || res)
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage['id'],
  }
}
/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags */
export function useFindPetsByTagsHookInfinite<
  TQueryFnData extends FindPetsByTags['data'] = FindPetsByTags['data'],
  TError = FindPetsByTags['error'],
  TData = FindPetsByTags['response'],
  TQueryData = FindPetsByTags['response'],
  TQueryKey extends QueryKey = FindPetsByTagsInfiniteQueryKey,
>(params?: FindPetsByTags['queryParams'], options: {
  query?: UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
  client?: FindPetsByTags['client']['paramaters']
} = {}): UseInfiniteQueryResult<TData, TError> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? findPetsByTagsInfiniteQueryKey(params)
  const query = useInfiniteQuery<any, TError, TData, any>({
    ...findPetsByTagsInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryData>(params, clientOptions),
    queryKey,
    ...queryOptions,
  }) as UseInfiniteQueryResult<TData, TError> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
export const findPetsByTagsSuspenseQueryKey = (params?: FindPetsByTags['queryParams']) => [{ url: '/pet/findByTags' }, ...(params ? [params] : [])] as const
export type FindPetsByTagsSuspenseQueryKey = ReturnType<typeof findPetsByTagsSuspenseQueryKey>
export function findPetsByTagsSuspenseQueryOptions<
  TQueryFnData extends FindPetsByTags['data'] = FindPetsByTags['data'],
  TError = FindPetsByTags['error'],
  TData = FindPetsByTags['response'],
>(
  params?: FindPetsByTags['queryParams'],
  options: FindPetsByTags['client']['paramaters'] = {},
): UseSuspenseQueryOptions<FindPetsByTags['unionResponse'], TError, TData, FindPetsByTagsSuspenseQueryKey> {
  const queryKey = findPetsByTagsSuspenseQueryKey(params)
  return {
    queryKey,
    queryFn: () => {
      return client<TQueryFnData, TError>({
        method: 'get',
        url: `/pet/findByTags`,
        params,
        ...options,
      }).then(res => res?.data || res)
    },
  }
}
/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags */
export function useFindPetsByTagsHookSuspense<
  TQueryFnData extends FindPetsByTags['data'] = FindPetsByTags['data'],
  TError = FindPetsByTags['error'],
  TData = FindPetsByTags['response'],
  TQueryKey extends QueryKey = FindPetsByTagsSuspenseQueryKey,
>(params?: FindPetsByTags['queryParams'], options: {
  query?: UseSuspenseQueryOptions<TQueryFnData, TError, TData, TQueryKey>
  client?: FindPetsByTags['client']['paramaters']
} = {}): UseSuspenseQueryResult<TData, TError> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? findPetsByTagsSuspenseQueryKey(params)
  const query = useSuspenseQuery<any, TError, TData, any>({
    ...findPetsByTagsSuspenseQueryOptions<TQueryFnData, TError, TData>(params, clientOptions),
    queryKey,
    ...queryOptions,
  }) as UseSuspenseQueryResult<TData, TError> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
