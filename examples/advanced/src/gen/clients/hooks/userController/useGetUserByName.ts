import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { QueryKey, QueryClient, QueryObserverOptions, UseQueryResult } from '../../../../tanstack-query-hook'
import type {
  GetUserByNameResponseData,
  GetUserByNamePathParams,
  GetUserByNameStatus400,
  GetUserByNameStatus404,
} from '../../../models/ts/userController/GetUserByName.ts'
import { queryOptions, useQuery } from '../../../../tanstack-query-hook'
import { getUserByName } from '../../axios/userService/getUserByName.ts'

export const getUserByNameQueryKey = ({ username }: { username: GetUserByNamePathParams['username'] }) =>
  [{ url: '/user/:username', params: { username: username } }] as const

export type GetUserByNameQueryKey = ReturnType<typeof getUserByNameQueryKey>

export function getUserByNameQueryOptions(
  { username }: { username: GetUserByNamePathParams['username'] },
  config: Partial<RequestConfig> & { client?: typeof fetch } = {},
) {
  const queryKey = getUserByNameQueryKey({ username })
  return queryOptions<
    ResponseConfig<GetUserByNameResponseData>,
    ResponseErrorConfig<GetUserByNameStatus400 | GetUserByNameStatus404>,
    ResponseConfig<GetUserByNameResponseData>,
    typeof queryKey
  >({
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
 * {@link /user/:username}
 */
export function useGetUserByName<
  TData = ResponseConfig<GetUserByNameResponseData>,
  TQueryData = ResponseConfig<GetUserByNameResponseData>,
  TQueryKey extends QueryKey = GetUserByNameQueryKey,
>(
  { username }: { username: GetUserByNamePathParams['username'] },
  options: {
    query?: Partial<
      QueryObserverOptions<
        ResponseConfig<GetUserByNameResponseData>,
        ResponseErrorConfig<GetUserByNameStatus400 | GetUserByNameStatus404>,
        TData,
        TQueryData,
        TQueryKey
      >
    > & { client?: QueryClient }
    client?: Partial<RequestConfig> & { client?: typeof fetch }
  } = {},
) {
  const { query: queryConfig = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...queryOptions } = queryConfig
  const queryKey = queryOptions?.queryKey ?? getUserByNameQueryKey({ username })

  const query = useQuery(
    {
      ...getUserByNameQueryOptions({ username }, config),
      queryKey,
      ...queryOptions,
    } as unknown as QueryObserverOptions,
    queryClient,
  ) as UseQueryResult<TData, ResponseErrorConfig<GetUserByNameStatus400 | GetUserByNameStatus404>> & { queryKey: TQueryKey }

  query.queryKey = queryKey as TQueryKey

  return query
}
