import useSWR from 'swr'
import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  GetUserByName400,
  GetUserByName404,
  GetUserByNamePathParams,
  GetUserByNameQueryResponse,
} from '../../../models/ts/userController/GetUserByName.ts'
import { getUserByName } from '../../axios/userService/getUserByName.ts'

export const getUserByNameQueryKeySWR = ({ username }: { username: GetUserByNamePathParams['username'] }) =>
  [{ url: '/user/:username', params: { username: username } }] as const

export type GetUserByNameQueryKeySWR = ReturnType<typeof getUserByNameQueryKeySWR>

export function getUserByNameQueryOptionsSWR(
  { username }: { username: GetUserByNamePathParams['username'] },
  config: Partial<RequestConfig> & { client?: typeof fetch } = {},
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
    client?: Partial<RequestConfig> & { client?: typeof fetch }
    shouldFetch?: boolean
    immutable?: boolean
  } = {},
) {
  const { query: queryOptions, client: config = {}, shouldFetch = true, immutable } = options ?? {}

  const queryKey = getUserByNameQueryKeySWR({ username })

  return useSWR<ResponseConfig<GetUserByNameQueryResponse>, ResponseErrorConfig<GetUserByName400 | GetUserByName404>, GetUserByNameQueryKeySWR | null>(
    shouldFetch ? queryKey : null,
    {
      ...getUserByNameQueryOptionsSWR({ username }, config),
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
