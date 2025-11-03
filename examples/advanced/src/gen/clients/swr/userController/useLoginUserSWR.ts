import useSWR from 'swr'
import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { LoginUser400, LoginUserQueryParams, LoginUserQueryResponse } from '../../../models/ts/userController/LoginUser.ts'
import { loginUser } from '../../axios/userService/loginUser.ts'

export const loginUserQueryKeySWR = (params?: LoginUserQueryParams) => [{ url: '/user/login' }, ...(params ? [params] : [])] as const

export type LoginUserQueryKeySWR = ReturnType<typeof loginUserQueryKeySWR>

export function loginUserQueryOptionsSWR({ params }: { params?: LoginUserQueryParams }, config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
  return {
    fetcher: async () => {
      return loginUser({ params }, config)
    },
  }
}

/**
 * @summary Logs user into the system
 * {@link /user/login}
 */
export function useLoginUserSWR(
  { params }: { params?: LoginUserQueryParams },
  options: {
    query?: Parameters<typeof useSWR<ResponseConfig<LoginUserQueryResponse>, ResponseErrorConfig<LoginUser400>>>[2]
    client?: Partial<RequestConfig> & { client?: typeof fetch }
    shouldFetch?: boolean
    immutable?: boolean
  } = {},
) {
  const { query: queryOptions, client: config = {}, shouldFetch = true, immutable } = options ?? {}

  const queryKey = loginUserQueryKeySWR(params)

  return useSWR<ResponseConfig<LoginUserQueryResponse>, ResponseErrorConfig<LoginUser400>, LoginUserQueryKeySWR | null>(shouldFetch ? queryKey : null, {
    ...loginUserQueryOptionsSWR({ params }, config),
    ...(immutable
      ? {
          revalidateIfStale: false,
          revalidateOnFocus: false,
          revalidateOnReconnect: false,
        }
      : {}),
    ...queryOptions,
  })
}
