import client from '@kubb/swagger-client/client'
import { useQuery } from '@tanstack/vue-query'
import { unref } from 'vue'
import type { KubbQueryFactory } from './types'
import type { FindPetsByStatusQueryResponse, FindPetsByStatusQueryParams, FindPetsByStatus400 } from '../models/FindPetsByStatus'
import type { UseQueryReturnType, QueryObserverOptions, QueryKey } from '@tanstack/vue-query'
import type { MaybeRef } from 'vue'

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
export const findPetsByStatusQueryKey = (params?: MaybeRef<FindPetsByStatus['queryParams']>) =>
  [{ url: `/pet/findByStatus` }, ...(params ? [params] : [])] as const
export type FindPetsByStatusQueryKey = ReturnType<typeof findPetsByStatusQueryKey>
export function findPetsByStatusQueryOptions<
  TQueryFnData extends FindPetsByStatus['data'] = FindPetsByStatus['data'],
  TError = FindPetsByStatus['error'],
  TData = FindPetsByStatus['response'],
  TQueryData = FindPetsByStatus['response'],
>(
  refParams?: MaybeRef<FindPetsByStatusQueryParams>,
  options: FindPetsByStatus['client']['paramaters'] = {},
): QueryObserverOptions<FindPetsByStatus['unionResponse'], TError, TData, TQueryData, FindPetsByStatusQueryKey> {
  const queryKey = findPetsByStatusQueryKey(refParams)
  return {
    queryKey,
    queryFn: () => {
      const params = unref(refParams)
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

export function useFindPetsByStatus<
  TQueryFnData extends FindPetsByStatus['data'] = FindPetsByStatus['data'],
  TError = FindPetsByStatus['error'],
  TData = FindPetsByStatus['response'],
  TQueryData = FindPetsByStatus['response'],
  TQueryKey extends QueryKey = FindPetsByStatusQueryKey,
>(
  refParams?: MaybeRef<FindPetsByStatusQueryParams>,
  options: {
    query?: QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
    client?: FindPetsByStatus['client']['paramaters']
  } = {},
): UseQueryReturnType<TData, TError> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? findPetsByStatusQueryKey(refParams)
  const query = useQuery<any, TError, TData, any>({
    ...findPetsByStatusQueryOptions<TQueryFnData, TError, TData, TQueryData>(refParams, clientOptions),
    queryKey,
    ...queryOptions,
  }) as UseQueryReturnType<TData, TError> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
