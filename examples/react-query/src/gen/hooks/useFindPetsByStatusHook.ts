import client from '@kubb/swagger-client/client'

import {   useQuery  } from '@tanstack/react-query'

import type {QueryKey, UseBaseQueryOptions, UseQueryResult} from '@tanstack/react-query';
import type { FindPetsByStatus400, FindPetsByStatusQueryParams,FindPetsByStatusQueryResponse } from '../models/FindPetsByStatus.ts';
import type { KubbQueryFactory } from './types.ts'

type FindPetsByStatus = KubbQueryFactory<
  FindPetsByStatusQueryResponse,
  FindPetsByStatus400 | { test: 2 },
  never,
  FindPetsByStatusQueryParams,
  FindPetsByStatusQueryParams,
  FindPetsByStatusQueryResponse,
  { dataReturnType: 'data'; type: 'query' }
>


export const findPetsByStatusQueryKey = (params?: FindPetsByStatus['queryParams']) => [{ url: `/pet/findByStatus` }, ...(params ? [params] : [])] as const
// new type for generation

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
}

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * @link /pet/findByStatus
 */
export function useFindPetsByStatusHook<
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
    ...findPetsByStatusQueryOptions<TQueryFnData, TError, TData,TQueryData>(params, clientOptions),
    ...queryOptions,
  }) as UseQueryResult<TData, TError> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
