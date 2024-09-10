import client from '../../../../tanstack-query-client.ts'
import type { RequestConfig } from '../../../../tanstack-query-client.ts'
import type { QueryKey, QueryObserverOptions, UseQueryResult } from '../../../../tanstack-query-hook.ts'
import type {
  GetUserByNameQueryResponse,
  GetUserByNamePathParams,
  GetUserByName400,
  GetUserByName404,
} from '../../../models/ts/userController/GetUserByName.ts'
import { useQuery, queryOptions } from '../../../../tanstack-query-hook.ts'
import { getUserByNameQueryResponseSchema } from '../../../zod/userController/getUserByNameSchema.ts'

export const getUserByNameQueryKey = (username: GetUserByNamePathParams['username']) => [{ url: '/user/:username', params: { username: username } }] as const

export type GetUserByNameQueryKey = ReturnType<typeof getUserByNameQueryKey>

/**
 * @summary Get user by user name
 * @link /user/:username
 */
async function getUserByName(username: GetUserByNamePathParams['username'], config: Partial<RequestConfig> = {}) {
  const res = await client<GetUserByNameQueryResponse, GetUserByName400 | GetUserByName404, unknown>({
    method: 'get',
    url: `/user/${username}`,
    baseURL: 'https://petstore3.swagger.io/api/v3',
    ...config,
  })
  return getUserByNameQueryResponseSchema.parse(res.data)
}

export function getUserByNameQueryOptions(username: GetUserByNamePathParams['username'], config: Partial<RequestConfig> = {}) {
  const queryKey = getUserByNameQueryKey(username)
  return queryOptions({
    queryKey,
    queryFn: async () => {
      return getUserByName(username, config)
    },
  })
}

/**
 * @summary Get user by user name
 * @link /user/:username
 */
export function useGetUserByName<
  TData = GetUserByNameQueryResponse,
  TQueryData = GetUserByNameQueryResponse,
  TQueryKey extends QueryKey = GetUserByNameQueryKey,
>(
  username: GetUserByNamePathParams['username'],
  options: {
    query?: Partial<QueryObserverOptions<GetUserByNameQueryResponse, GetUserByName400 | GetUserByName404, TData, TQueryData, TQueryKey>>
    client?: Partial<RequestConfig>
  } = {},
) {
  const { query: queryOptions, client: config = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getUserByNameQueryKey(username)
  const query = useQuery({
    ...(getUserByNameQueryOptions(username, config) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, 'queryKey'>),
  }) as UseQueryResult<TData, GetUserByName400 | GetUserByName404> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
