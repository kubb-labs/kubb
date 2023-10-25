import { useInfiniteQuery, useQuery } from '@tanstack/react-query'

import client from '../../../../tanstack-query-client.ts'

import type { QueryKey, UseBaseQueryOptions, UseInfiniteQueryOptions, UseInfiniteQueryResult, UseQueryResult } from '@tanstack/react-query'
import type { ResponseConfig } from '../../../../tanstack-query-client.ts'
import type {
  FindPetsByTags400,
  FindPetsByTagsHeaderParams,
  FindPetsByTagsQueryParams,
  FindPetsByTagsQueryResponse,
} from '../../../models/ts/petController/FindPetsByTags'
import type { KubbQueryFactory } from './types'

type FindPetsByTags = KubbQueryFactory<FindPetsByTagsQueryResponse, FindPetsByTags400, never, never, FindPetsByTagsQueryParams, FindPetsByTagsQueryResponse, {
  dataReturnType: 'full'
  type: 'query'
}>
export const findPetsByTagsQueryKey = (params?: FindPetsByTags['queryParams']) => [{ url: `/pet/findByTags` }, ...(params ? [params] : [])] as const
export type FindPetsByTagsQueryKey = ReturnType<typeof findPetsByTagsQueryKey>
export function findPetsByTagsQueryOptions<
  TQueryFnData extends FindPetsByTags['data'] = FindPetsByTags['data'],
  TError = FindPetsByTags['error'],
  TData = FindPetsByTags['response'],
  TQueryData = FindPetsByTags['response'],
>(
  headers: FindPetsByTagsHeaderParams,
  params?: FindPetsByTags['queryParams'],
  options: FindPetsByTags['client']['paramaters'] = {},
): UseBaseQueryOptions<FindPetsByTags['unionResponse'], TError, TData, TQueryData, FindPetsByTagsQueryKey> {
  const queryKey = findPetsByTagsQueryKey(params)
  return {
    queryKey,
    queryFn: () => {
      return client<TQueryFnData, TError>({
        method: 'get',
        url: `/pet/findByTags`,
        params,
        headers: { ...headers, ...options.headers },
        ...options,
      }).then(res => res?.data || res)
    },
  }
}

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags
 */
export function useFindPetsByTags<
  TQueryFnData extends FindPetsByTags['data'] = FindPetsByTags['data'],
  TError = FindPetsByTags['error'],
  TData = FindPetsByTags['response'],
  TQueryData = FindPetsByTags['response'],
  TQueryKey extends QueryKey = FindPetsByTagsQueryKey,
>(headers: FindPetsByTagsHeaderParams, params?: FindPetsByTags['queryParams'], options: {
  query?: UseBaseQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
  client?: FindPetsByTags['client']['paramaters']
} = {}): UseQueryResult<TData, TError> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? findPetsByTagsQueryKey(params)
  const query = useQuery<TQueryFnData, TError, TData, any>({
    ...findPetsByTagsQueryOptions<TQueryFnData, TError, TData, TQueryData>(headers, params, clientOptions),
    ...queryOptions,
  }) as UseQueryResult<TData, TError> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}

export function findPetsByTagsQueryOptionsInfinite<TData = FindPetsByTagsQueryResponse, TError = FindPetsByTags400>(
  headers: FindPetsByTagsHeaderParams,
  params?: FindPetsByTagsQueryParams,
  options: Partial<Parameters<typeof client>[0]> = {},
): UseInfiniteQueryOptions<ResponseConfig<TData>, TError> {
  const queryKey = findPetsByTagsQueryKey(params)
  return {
    queryKey,
    queryFn: ({ pageParam }) => {
      return client<TData, TError>({
        method: 'get',
        url: `/pet/findByTags`,
        headers: { ...headers, ...options.headers },
        ...options,
        params: {
          ...params,
          ['test']: pageParam,
          ...(options.params || {}),
        },
      }).then(res => res)
    },
  }
}

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags
 */
export function useFindPetsByTagsInfinite<TData = FindPetsByTagsQueryResponse, TError = FindPetsByTags400>(
  headers: FindPetsByTagsHeaderParams,
  params?: FindPetsByTagsQueryParams,
  options: {
    query?: UseInfiniteQueryOptions<ResponseConfig<TData>, TError>
    client?: Partial<Parameters<typeof client<TData, TError>>[0]>
  } = {},
): UseInfiniteQueryResult<ResponseConfig<TData>, TError> & {
  queryKey: QueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? findPetsByTagsQueryKey(params)
  const query = useInfiniteQuery<ResponseConfig<TData>, TError>({
    ...findPetsByTagsQueryOptionsInfinite<TData, TError>(headers, params, clientOptions),
    ...queryOptions,
  }) as UseInfiniteQueryResult<ResponseConfig<TData>, TError> & {
    queryKey: QueryKey
  }
  query.queryKey = queryKey
  return query
}
