import client from '@kubb/swagger-client/client'
import { useQuery } from '@tanstack/vue-query'
import { unref } from 'vue'
import type { KubbQueryFactory } from './types'
import type { GetUserByNameQueryResponse, GetUserByNamePathParams, GetUserByName400, GetUserByName404 } from '../models/GetUserByName'
import type { QueryObserverOptions, UseQueryReturnType, QueryKey } from '@tanstack/vue-query'
import type { MaybeRef } from 'vue'

type GetUserByName = KubbQueryFactory<
  GetUserByNameQueryResponse,
  GetUserByName400 | GetUserByName404,
  never,
  GetUserByNamePathParams,
  never,
  never,
  GetUserByNameQueryResponse,
  {
    dataReturnType: 'data'
    type: 'query'
  }
>
export const getUserByNameQueryKey = (username: MaybeRef<GetUserByNamePathParams['username']>) =>
  [{ url: '/user/:username', params: { username: username } }] as const
export type GetUserByNameQueryKey = ReturnType<typeof getUserByNameQueryKey>
export function getUserByNameQueryOptions<
  TQueryFnData extends GetUserByName['data'] = GetUserByName['data'],
  TError = GetUserByName['error'],
  TData = GetUserByName['response'],
  TQueryData = GetUserByName['response'],
>(
  refUsername: MaybeRef<GetUserByNamePathParams['username']>,
  options: GetUserByName['client']['paramaters'] = {},
): QueryObserverOptions<GetUserByName['unionResponse'], TError, TData, TQueryData, GetUserByNameQueryKey> {
  const queryKey = getUserByNameQueryKey(refUsername)
  return {
    queryKey,
    queryFn: () => {
      const username = unref(refUsername)
      return client<TQueryFnData, TError>({
        method: 'get',
        url: `/user/${username}`,
        ...options,
      }).then((res) => res?.data || res)
    },
  }
} /**
 * @summary Get user by user name
 * @link /user/:username
 */

export function useGetUserByName<
  TQueryFnData extends GetUserByName['data'] = GetUserByName['data'],
  TError = GetUserByName['error'],
  TData = GetUserByName['response'],
  TQueryData = GetUserByName['response'],
  TQueryKey extends QueryKey = GetUserByNameQueryKey,
>(
  refUsername: GetUserByNamePathParams['username'],
  options: {
    query?: QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
    client?: GetUserByName['client']['paramaters']
  } = {},
): UseQueryReturnType<TData, TError> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getUserByNameQueryKey(refUsername)
  const query = useQuery<any, TError, TData, any>({
    ...getUserByNameQueryOptions<TQueryFnData, TError, TData, TQueryData>(refUsername, clientOptions),
    queryKey,
    ...queryOptions,
  }) as UseQueryReturnType<TData, TError> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
