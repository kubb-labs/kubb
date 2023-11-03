import { createQuery, createInfiniteQuery } from '@tanstack/svelte-query'
import client from '@kubb/swagger-client/client'
import type { KubbQueryFactory } from './types'
import type { QueryKey, CreateBaseQueryOptions, CreateQueryResult, CreateInfiniteQueryOptions, CreateInfiniteQueryResult } from '@tanstack/svelte-query'
import type { FindPetsByTagsQueryResponse, FindPetsByTagsQueryParams, FindPetsByTags400 } from '../models/FindPetsByTags'

type FindPetsByTags = KubbQueryFactory<
  FindPetsByTagsQueryResponse,
  FindPetsByTags400,
  never,
  never,
  FindPetsByTagsQueryParams,
  never,
  FindPetsByTagsQueryResponse,
  {
    dataReturnType: 'data'
    type: 'query'
  }
>
export const findPetsByTagsQueryKey = (params?: FindPetsByTags['queryParams']) => [{ url: `/pet/findByTags` }, ...(params ? [params] : [])] as const
export type FindPetsByTagsQueryKey = ReturnType<typeof findPetsByTagsQueryKey>
export function findPetsByTagsQueryOptions<
  TQueryFnData extends FindPetsByTags['data'] = FindPetsByTags['data'],
  TError = FindPetsByTags['error'],
  TData = FindPetsByTags['response'],
  TQueryData = FindPetsByTags['response'],
>(
  params?: FindPetsByTags['queryParams'],
  options: FindPetsByTags['client']['paramaters'] = {},
): CreateBaseQueryOptions<FindPetsByTags['unionResponse'], TError, TData, TQueryData, FindPetsByTagsQueryKey> {
  const queryKey = findPetsByTagsQueryKey(params)

  return {
    queryKey,
    queryFn: () => {
      return client<TQueryFnData, TError>({
        method: 'get',
        url: `/pet/findByTags`,
        params,
        ...options,
      }).then((res) => res?.data || res)
    },
  }
}
/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags
 */
export function findPetsByTagsQuery<
  TQueryFnData extends FindPetsByTags['data'] = FindPetsByTags['data'],
  TError = FindPetsByTags['error'],
  TData = FindPetsByTags['response'],
  TQueryData = FindPetsByTags['response'],
  TQueryKey extends QueryKey = FindPetsByTagsQueryKey,
>(
  params?: FindPetsByTags['queryParams'],
  options: {
    query?: CreateBaseQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
    client?: FindPetsByTags['client']['paramaters']
  } = {},
): CreateQueryResult<TData, TError> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? findPetsByTagsQueryKey(params)

  const query = createQuery<TQueryFnData, TError, TData, any>({
    ...findPetsByTagsQueryOptions<TQueryFnData, TError, TData, TQueryData>(params, clientOptions),
    queryKey,
    ...queryOptions,
  }) as CreateQueryResult<TData, TError> & {
    queryKey: TQueryKey
  }

  query.queryKey = queryKey as TQueryKey

  return query
}

export function findPetsByTagsQueryOptionsInfinite<
  TQueryFnData extends FindPetsByTags['data'] = FindPetsByTags['data'],
  TError = FindPetsByTags['error'],
  TData = FindPetsByTags['response'],
  TQueryData = FindPetsByTags['response'],
>(
  params?: FindPetsByTags['queryParams'],
  options: FindPetsByTags['client']['paramaters'] = {},
): CreateInfiniteQueryOptions<FindPetsByTags['unionResponse'], TError, TData, TQueryData, FindPetsByTagsQueryKey> {
  const queryKey = findPetsByTagsQueryKey(params)

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
      }).then((res) => res?.data || res)
    },
  }
}
/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags
 */
export function findPetsByTagsQueryInfinite<
  TQueryFnData extends FindPetsByTags['data'] = FindPetsByTags['data'],
  TError = FindPetsByTags['error'],
  TData = FindPetsByTags['response'],
  TQueryData = FindPetsByTags['response'],
  TQueryKey extends QueryKey = FindPetsByTagsQueryKey,
>(
  params?: FindPetsByTags['queryParams'],
  options: {
    query?: CreateInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
    client?: FindPetsByTags['client']['paramaters']
  } = {},
): CreateInfiniteQueryResult<TData, TError> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? findPetsByTagsQueryKey(params)

  const query = createInfiniteQuery<TQueryFnData, TError, TData, any>({
    ...findPetsByTagsQueryOptionsInfinite<TQueryFnData, TError, TData, TQueryData>(params, clientOptions),
    queryKey,
    ...queryOptions,
  }) as CreateInfiniteQueryResult<TData, TError> & {
    queryKey: TQueryKey
  }

  query.queryKey = queryKey as TQueryKey

  return query
}
