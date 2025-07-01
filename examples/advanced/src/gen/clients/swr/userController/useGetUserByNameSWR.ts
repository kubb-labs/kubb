import type client from '../../../../axios-client.ts'
import useSWR from 'swr'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type {
  GetUserByNameQueryResponse,
  GetUserByNamePathParams,
  GetUserByName400,
  GetUserByName404,
} from '../../../models/ts/userController/GetUserByName.ts'
import { getUserByName } from '../../axios/userService/getUserByName.ts'

export const getUserByNameQueryKeySWR = ({ username }: { username: GetUserByNamePathParams['username'] }) =>
  [{ url: '/user/:username', params: { username: username } }] as const

export type GetUserByNameQueryKeySWR = ReturnType<typeof getUserByNameQueryKeySWR>

export function getUserByNameQueryOptionsSWR(
  { username }: { username: GetUserByNamePathParams['username'] },
  config: Partial<RequestConfig> & { client?: typeof client } = {},
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
    client?: Partial<RequestConfig> & { client?: typeof client }
    shouldFetch?: boolean
  } = {},
) {
  const { query: queryOptions, client: config = {}, shouldFetch = true } = options ?? {}

  const queryKey = getUserByNameQueryKeySWR({ username })

  return useSWR<ResponseConfig<GetUserByNameQueryResponse>, ResponseErrorConfig<GetUserByName400 | GetUserByName404>, GetUserByNameQueryKeySWR | null>(
    shouldFetch ? queryKey : null,
    {
      ...getUserByNameQueryOptionsSWR({ username }, config),
      ...queryOptions,
    },
  )
}
