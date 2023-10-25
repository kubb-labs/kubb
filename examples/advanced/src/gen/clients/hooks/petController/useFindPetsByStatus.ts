/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable unused-imports/no-unused-vars */
import { useQuery } from '@tanstack/react-query'

import client from '../../../../tanstack-query-client.ts'
import { FindPetsByStatusQueryParamsStatus } from '../../../models/ts/petController/FindPetsByStatus'

import type { QueryKey, UseBaseQueryOptions, UseQueryResult } from '@tanstack/react-query'
import type { FindPetsByStatus400, FindPetsByStatusQueryParams, FindPetsByStatusQueryResponse } from '../../../models/ts/petController/FindPetsByStatus'
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

type Test = FindPetsByStatus['data']

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
    ...queryOptions,
  }) as UseQueryResult<TData, TError> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}

const queryOptions = findPetsByStatusQueryOptions()
const query = useFindPetsByStatus()

const queryKeyOptions = queryOptions.queryKey
//    ^?

const queryKeyOptionsInitialData = queryOptions.initialData
//    ^?

const data = query.data
//    ^?

const error = query.error
//    ^?

const queryKey = query.queryKey
//    ^?

// overrides

const queryOverride = useFindPetsByStatus({ status: FindPetsByStatusQueryParamsStatus.available }, {
  query: {
    queryKey: ['test'] as const,
    enabled: false,
    select: (data => {
      return data
      //      ^?
    }),
  },
})
//    ^?

const queryOverrideData = queryOverride.data
//    ^?

const queryOverrideQueryKey = queryOverride.queryKey
//    ^?
