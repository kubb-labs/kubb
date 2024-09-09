import client from '@kubb/plugin-client/client'
import type { GetUserByNameQueryResponse, GetUserByNamePathParams, GetUserByName400, GetUserByName404 } from '../models/GetUserByName.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'
import type { QueryKey, UseSuspenseQueryOptions, UseSuspenseQueryResult } from '@tanstack/react-query'
import { useSuspenseQuery, queryOptions } from '@tanstack/react-query'

export const getUserByNameSuspenseQueryKey = ({
  username,
}: {
  username: GetUserByNamePathParams['username']
}) => ['v5', { url: '/user/:username', params: { username: username } }] as const

export type GetUserByNameSuspenseQueryKey = ReturnType<typeof getUserByNameSuspenseQueryKey>

/**
 * @summary Get user by user name
 * @link /user/:username
 */
async function getUserByName(
  {
    username,
  }: {
    username: GetUserByNamePathParams['username']
  },
  config: Partial<RequestConfig> = {},
) {
  const res = await client<GetUserByNameQueryResponse, GetUserByName400 | GetUserByName404, unknown>({
    method: 'get',
    url: `/user/${username}`,
    baseURL: 'https://petstore3.swagger.io/api/v3',
    ...config,
  })
  return res.data
}

export function getUserByNameSuspenseQueryOptions(
  {
    username,
  }: {
    username: GetUserByNamePathParams['username']
  },
  config: Partial<RequestConfig> = {},
) {
  const queryKey = getUserByNameSuspenseQueryKey({ username })
  return queryOptions({
    queryKey,
    queryFn: async () => {
      return getUserByName({ username }, config)
    },
  })
}

/**
 * @summary Get user by user name
 * @link /user/:username
 */
export function useGetUserByNameSuspenseHook<
  TData = GetUserByNameQueryResponse,
  TQueryData = GetUserByNameQueryResponse,
  TQueryKey extends QueryKey = GetUserByNameSuspenseQueryKey,
>(
  {
    username,
  }: {
    username: GetUserByNamePathParams['username']
  },
  options: {
    query?: Partial<UseSuspenseQueryOptions<GetUserByNameQueryResponse, GetUserByName400 | GetUserByName404, TData, TQueryKey>>
    client?: Partial<RequestConfig>
  } = {},
) {
  const { query: queryOptions, client: config = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getUserByNameSuspenseQueryKey({ username })
  const query = useSuspenseQuery({
    ...(getUserByNameSuspenseQueryOptions({ username }, config) as unknown as UseSuspenseQueryOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<UseSuspenseQueryOptions, 'queryKey'>),
  }) as UseSuspenseQueryResult<TData, GetUserByName400 | GetUserByName404> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
