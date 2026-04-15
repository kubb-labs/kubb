import useSWR from 'swr'
import type { Client, RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type {
  GetUserByNamePathParams,
  GetUserByNameQueryResponse,
  GetUserByName400,
  GetUserByName404,
} from '../../../models/ts/userController/GetUserByName.ts'
import { getUserByName } from '../../axios/userService/getUserByName.ts'

export const getUserByNameSWRQueryKey = ({ username }: { username: GetUserByNamePathParams['username'] }) =>
  [{ url: '/user/:username', params: { username: username } }] as const

export type GetUserByNameSWRQueryKey = ReturnType<typeof getUserByNameSWRQueryKey>

export function getUserByNameSWRQueryOptions(
  { username }: { username: GetUserByNamePathParams['username'] },
  config: Partial<RequestConfig> & { client?: Client } = {},
) {
  return {
    fetcher: async () => {
      return getUserByName({ username }, config)
    },
  }
}

/**
 * @summary Get user by user name
 * {@link /user/:username}
 */
export function useGetUserByNameSWR(
  { username }: { username: GetUserByNamePathParams['username'] },
  options: {
    query?: Parameters<typeof useSWR<ResponseConfig<GetUserByNameQueryResponse>, ResponseErrorConfig<GetUserByName400 | GetUserByName404>>>[2]
    client?: Partial<RequestConfig> & { client?: Client }
    shouldFetch?: boolean
    immutable?: boolean
  } = {},
) {
  const { query: queryOptions, client: config = {}, shouldFetch = true, immutable } = options ?? {}

  const queryKey = getUserByNameSWRQueryKey({ username })

  return useSWR<ResponseConfig<GetUserByNameQueryResponse>, ResponseErrorConfig<GetUserByName400 | GetUserByName404>, GetUserByNameSWRQueryKey | null>(
    shouldFetch ? queryKey : null,
    {
      ...getUserByNameSWRQueryOptions({ username }, config),
      ...(immutable
        ? {
            revalidateIfStale: false,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
          }
        : {}),
      ...queryOptions,
    },
  )
}
