import client from '../../../../tanstack-query-client.ts'
import type { RequestConfig, ResponseConfig } from '../../../../tanstack-query-client.ts'
import type { QueryKey, QueryObserverOptions, UseQueryResult } from '../../../../tanstack-query-hook.ts'
import type {
  GetUserByNameQueryResponse,
  GetUserByNamePathParams,
  GetUserByName400,
  GetUserByName404,
} from '../../../models/ts/userController/GetUserByName.ts'
import { useQuery, queryOptions } from '../../../../tanstack-query-hook.ts'
import { getUserByNameQueryResponseSchema } from '../../../zod/userController/getUserByNameSchema.ts'

export const getUserByNameQueryKey = ({
  username,
}: {
  username: GetUserByNamePathParams['username']
}) => [{ url: '/user/:username', params: { username: username } }] as const

export type GetUserByNameQueryKey = ReturnType<typeof getUserByNameQueryKey>

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
  const res = await client<GetUserByNameQueryResponse, GetUserByName400 | GetUserByName404, unknown>({ method: 'GET', url: `/user/${username}`, ...config })
  return { ...res, data: getUserByNameQueryResponseSchema.parse(res.data) }
}

export function getUserByNameQueryOptions(
  {
    username,
  }: {
    username: GetUserByNamePathParams['username']
  },
  config: Partial<RequestConfig> = {},
) {
  const queryKey = getUserByNameQueryKey({ username })
  return queryOptions({
    enabled: !!username,
    queryKey,
    queryFn: async ({ signal }) => {
      config.signal = signal
      return getUserByName({ username }, config)
    },
  })
}

/**
 * @summary Get user by user name
 * @link /user/:username
 */
export function useGetUserByName<
  TData = ResponseConfig<GetUserByNameQueryResponse>,
  TQueryData = ResponseConfig<GetUserByNameQueryResponse>,
  TQueryKey extends QueryKey = GetUserByNameQueryKey,
>(
  {
    username,
  }: {
    username: GetUserByNamePathParams['username']
  },
  options: {
    query?: Partial<QueryObserverOptions<ResponseConfig<GetUserByNameQueryResponse>, GetUserByName400 | GetUserByName404, TData, TQueryData, TQueryKey>>
    client?: Partial<RequestConfig>
  } = {},
) {
  const { query: queryOptions, client: config = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getUserByNameQueryKey({ username })
  const query = useQuery({
    ...(getUserByNameQueryOptions({ username }, config) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, 'queryKey'>),
  }) as UseQueryResult<TData, GetUserByName400 | GetUserByName404> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
