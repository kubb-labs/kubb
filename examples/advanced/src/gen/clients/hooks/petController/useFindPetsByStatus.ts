import client from '../../../../tanstack-query-client.ts'
import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import type { KubbQueryFactory } from './types'
import type { FindPetsByStatusQueryResponse, FindPetsByStatusQueryParams, FindPetsByStatus400 } from '../../../models/ts/petController/FindPetsByStatus'
import type { UseBaseQueryOptions, UseQueryResult, QueryKey, UseInfiniteQueryOptions, UseInfiniteQueryResult } from '@tanstack/react-query'

type FindPetsByStatus = KubbQueryFactory<
  FindPetsByStatusQueryResponse,
  FindPetsByStatus400,
  never,
  never,
  FindPetsByStatusQueryParams,
  never,
  FindPetsByStatusQueryResponse,
  {
    dataReturnType: 'full'
    type: 'query'
  }
>
export const findPetsByStatusQueryKey = (params?: FindPetsByStatus['queryParams']) => [{ url: '/pet/findByStatus' }, ...(params ? [params] : [])] as const
export type FindPetsByStatusQueryKey = ReturnType<typeof findPetsByStatusQueryKey>
export function findPetsByStatusQueryOptions<
  TQueryFnData extends FindPetsByStatus['data'] = FindPetsByStatus['data'],
  TError = FindPetsByStatus['error'],
  TData = FindPetsByStatus['response'],
  TQueryData = FindPetsByStatus['response'],
>(
  params?: FindPetsByStatus['queryParams'],
  options: FindPetsByStatus['client']['paramaters'] = {},
): UseBaseQueryOptions<FindPetsByStatus['unionResponse'], TError, TData, TQueryData, FindPetsByStatusQueryKey> {
  const queryKey = findPetsByStatusQueryKey(params)
  return {
    queryKey,
    queryFn: () => {
      return client<TQueryFnData, TError>({
        method: 'get',
        url: `/pet/findByStatus`,
        params,
        ...options,
      }).then(res => res?.data || res)
    },
  }
} /**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * @link /pet/findByStatus
 */

export function useFindPetsByStatus<
  TQueryFnData extends FindPetsByStatus['data'] = FindPetsByStatus['data'],
  TError = FindPetsByStatus['error'],
  TData = FindPetsByStatus['response'],
  TQueryData = FindPetsByStatus['response'],
  TQueryKey extends QueryKey = FindPetsByStatusQueryKey,
>(params?: FindPetsByStatus['queryParams'], options: {
  query?: UseBaseQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
  client?: FindPetsByStatus['client']['paramaters']
} = {}): UseQueryResult<TData, TError> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? findPetsByStatusQueryKey(params)
  const query = useQuery<TQueryFnData, TError, TData, any>({
    ...findPetsByStatusQueryOptions<TQueryFnData, TError, TData, TQueryData>(params, clientOptions),
    queryKey,
    ...queryOptions,
  }) as UseQueryResult<TData, TError> & {
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
    dataReturnType: 'full'
    type: 'query'
  }
>
export const findPetsByStatusInfiniteQueryKey = (params?: FindPetsByStatusInfinite['queryParams']) =>
  [{ url: '/pet/findByStatus' }, ...(params ? [params] : [])] as const
export type FindPetsByStatusInfiniteQueryKey = ReturnType<typeof findPetsByStatusInfiniteQueryKey>
export function findPetsByStatusInfiniteQueryOptions<
  TQueryFnData extends FindPetsByStatusInfinite['data'] = FindPetsByStatusInfinite['data'],
  TError = FindPetsByStatusInfinite['error'],
  TData = FindPetsByStatusInfinite['response'],
  TQueryData = FindPetsByStatusInfinite['response'],
>(
  params?: FindPetsByStatusInfinite['queryParams'],
  options: FindPetsByStatusInfinite['client']['paramaters'] = {},
): UseInfiniteQueryOptions<FindPetsByStatusInfinite['unionResponse'], TError, TData, TQueryData, FindPetsByStatusInfiniteQueryKey> {
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
          ['test']: pageParam,
          ...(options.params || {}),
        },
      }).then(res => res?.data || res)
    },
  }
} /**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * @link /pet/findByStatus
 */

export function useFindPetsByStatusInfinite<
  TQueryFnData extends FindPetsByStatusInfinite['data'] = FindPetsByStatusInfinite['data'],
  TError = FindPetsByStatusInfinite['error'],
  TData = FindPetsByStatusInfinite['response'],
  TQueryData = FindPetsByStatusInfinite['response'],
  TQueryKey extends QueryKey = FindPetsByStatusInfiniteQueryKey,
>(params?: FindPetsByStatusInfinite['queryParams'], options: {
  query?: UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
  client?: FindPetsByStatusInfinite['client']['paramaters']
} = {}): UseInfiniteQueryResult<TData, TError> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? findPetsByStatusInfiniteQueryKey(params)
  const query = useInfiniteQuery<TQueryFnData, TError, TData, any>({
    ...findPetsByStatusInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryData>(params, clientOptions),
    queryKey,
    ...queryOptions,
  }) as UseInfiniteQueryResult<TData, TError> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
