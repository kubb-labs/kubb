import client from '@kubb/swagger-client/client'
import { createQuery, createInfiniteQuery } from '@tanstack/svelte-query'
import type { KubbQueryFactory } from './types'
import type { FindPetsByStatusQueryResponse, FindPetsByStatusQueryParams, FindPetsByStatus400 } from '../models/FindPetsByStatus'
import type { CreateBaseQueryOptions, CreateQueryResult, QueryKey, CreateInfiniteQueryOptions, CreateInfiniteQueryResult } from '@tanstack/svelte-query'

type FindPetsByStatus = KubbQueryFactory<
  FindPetsByStatusQueryResponse,
  FindPetsByStatus400,
  never,
  never,
  FindPetsByStatusQueryParams,
  never,
  FindPetsByStatusQueryResponse,
  {
    dataReturnType: 'data'
    type: 'query'
  }
>
export const findPetsByStatusQueryKey = (params?: FindPetsByStatus['queryParams']) => [{ url: `/pet/findByStatus` }, ...(params ? [params] : [])] as const
export type FindPetsByStatusQueryKey = ReturnType<typeof findPetsByStatusQueryKey>
export function findPetsByStatusQueryOptions<
  TQueryFnData extends FindPetsByStatus['data'] = FindPetsByStatus['data'],
  TError = FindPetsByStatus['error'],
  TData = FindPetsByStatus['response'],
  TQueryData = FindPetsByStatus['response'],
>(
  params?: FindPetsByStatus['queryParams'],
  options: FindPetsByStatus['client']['paramaters'] = {},
): CreateBaseQueryOptions<FindPetsByStatus['unionResponse'], TError, TData, TQueryData, FindPetsByStatusQueryKey> {
  const queryKey = findPetsByStatusQueryKey(params)
  return {
    queryKey,
    queryFn: () => {
      return client<TQueryFnData, TError>({
        method: 'get',
        url: `/pet/findByStatus`,
        params,
        ...options,
      }).then((res) => res?.data || res)
    },
  }
} /**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * @link /pet/findByStatus
 */

export function findPetsByStatusQuery<
  TQueryFnData extends FindPetsByStatus['data'] = FindPetsByStatus['data'],
  TError = FindPetsByStatus['error'],
  TData = FindPetsByStatus['response'],
  TQueryData = FindPetsByStatus['response'],
  TQueryKey extends QueryKey = FindPetsByStatusQueryKey,
>(
  params?: FindPetsByStatus['queryParams'],
  options: {
    query?: CreateBaseQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
    client?: FindPetsByStatus['client']['paramaters']
  } = {},
): CreateQueryResult<TData, TError> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? findPetsByStatusQueryKey(params)
  const query = createQuery<TQueryFnData, TError, TData, any>({
    ...findPetsByStatusQueryOptions<TQueryFnData, TError, TData, TQueryData>(params, clientOptions),
    queryKey,
    ...queryOptions,
  }) as CreateQueryResult<TData, TError> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
type FindPetsByStatusInfinite = KubbQueryFactory<
  FindPetsByStatusQueryResponse,
  FindPetsByStatus400,
  never,
  never,
  FindPetsByStatusQueryParams,
  never,
  FindPetsByStatusQueryResponse,
  {
    dataReturnType: 'data'
    type: 'query'
  }
>
export const findPetsByStatusInfiniteQueryKey = (params?: FindPetsByStatusInfinite['queryParams']) =>
  [{ url: `/pet/findByStatus` }, ...(params ? [params] : [])] as const
export type FindPetsByStatusInfiniteQueryKey = ReturnType<typeof findPetsByStatusInfiniteQueryKey>
export function findPetsByStatusInfiniteQueryOptions<
  TQueryFnData extends FindPetsByStatusInfinite['data'] = FindPetsByStatusInfinite['data'],
  TError = FindPetsByStatusInfinite['error'],
  TData = FindPetsByStatusInfinite['response'],
  TQueryData = FindPetsByStatusInfinite['response'],
>(
  params?: FindPetsByStatusInfinite['queryParams'],
  options: FindPetsByStatusInfinite['client']['paramaters'] = {},
): CreateInfiniteQueryOptions<FindPetsByStatusInfinite['unionResponse'], TError, TData, TQueryData, FindPetsByStatusInfiniteQueryKey> {
  const queryKey = findPetsByStatusInfiniteQueryKey(params)
  return {
    queryKey,
    queryFn: ({ pageParam }) => {
      return client<TQueryFnData, TError>({
        method: 'get',
        url: `/pet/findByStatus`,
        ...options,
        params: {
          ...params,
          ['id']: pageParam,
          ...(options.params || {}),
        },
      }).then((res) => res?.data || res)
    },
  }
} /**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * @link /pet/findByStatus
 */

export function findPetsByStatusQueryInfinite<
  TQueryFnData extends FindPetsByStatusInfinite['data'] = FindPetsByStatusInfinite['data'],
  TError = FindPetsByStatusInfinite['error'],
  TData = FindPetsByStatusInfinite['response'],
  TQueryData = FindPetsByStatusInfinite['response'],
  TQueryKey extends QueryKey = FindPetsByStatusInfiniteQueryKey,
>(
  params?: FindPetsByStatusInfinite['queryParams'],
  options: {
    query?: CreateInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
    client?: FindPetsByStatusInfinite['client']['paramaters']
  } = {},
): CreateInfiniteQueryResult<TData, TError> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? findPetsByStatusInfiniteQueryKey(params)
  const query = createInfiniteQuery<TQueryFnData, TError, TData, any>({
    ...findPetsByStatusInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryData>(params, clientOptions),
    queryKey,
    ...queryOptions,
  }) as CreateInfiniteQueryResult<TData, TError> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
