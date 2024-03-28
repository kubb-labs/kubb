import client from '@kubb/swagger-client/client'
import { useQuery } from '@tanstack/vue-query'
import type { QueryKey, UseQueryReturnType, WithRequired } from '@tanstack/vue-query'
import type { VueQueryObserverOptions } from '@tanstack/vue-query/build/lib/types'
import { unref } from 'vue'
import type { MaybeRef } from 'vue'
import type { GetUserByName400, GetUserByName404, GetUserByNamePathParams, GetUserByNameQueryResponse } from '../models/GetUserByName'

type GetUserByNameClient = typeof client<GetUserByNameQueryResponse, GetUserByName400 | GetUserByName404, never>
type GetUserByName = {
  data: GetUserByNameQueryResponse
  error: GetUserByName400 | GetUserByName404
  request: never
  pathParams: GetUserByNamePathParams
  queryParams: never
  headerParams: never
  response: GetUserByNameQueryResponse
  client: {
    parameters: Partial<Parameters<GetUserByNameClient>[0]>
    return: Awaited<ReturnType<GetUserByNameClient>>
  }
}
export const getUserByNameQueryKey = (username: MaybeRef<GetUserByNamePathParams['username']>) =>
  [{ url: '/user/:username', params: { username: username } }] as const
export type GetUserByNameQueryKey = ReturnType<typeof getUserByNameQueryKey>
export function getUserByNameQueryOptions<TData = GetUserByName['response'], TQueryData = GetUserByName['response']>(
  refUsername: MaybeRef<GetUserByNamePathParams['username']>,
  options: GetUserByName['client']['parameters'] = {},
): WithRequired<VueQueryObserverOptions<GetUserByName['response'], GetUserByName['error'], TData, TQueryData>, 'queryKey'> {
  const queryKey = getUserByNameQueryKey(refUsername)
  return {
    queryKey,
    queryFn: async () => {
      const username = unref(refUsername)
      const res = await client<GetUserByName['data'], GetUserByName['error']>({
        method: 'get',
        url: `/user/${username}`,
        ...options,
      })
      return res.data
    },
  }
}
/**
 * @summary Get user by user name
 * @link /user/:username
 */
export function useGetUserByName<TData = GetUserByName['response'], TQueryData = GetUserByName['response'], TQueryKey extends QueryKey = GetUserByNameQueryKey>(
  refUsername: GetUserByNamePathParams['username'],
  options: {
    query?: Partial<VueQueryObserverOptions<GetUserByName['response'], GetUserByName['error'], TData, TQueryKey>>
    client?: GetUserByName['client']['parameters']
  } = {},
): UseQueryReturnType<TData, GetUserByName['error']> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getUserByNameQueryKey(refUsername)
  const query = useQuery<GetUserByName['data'], GetUserByName['error'], TData, any>({
    ...getUserByNameQueryOptions<TData, TQueryData>(refUsername, clientOptions),
    queryKey,
    ...queryOptions,
  }) as UseQueryReturnType<TData, GetUserByName['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
