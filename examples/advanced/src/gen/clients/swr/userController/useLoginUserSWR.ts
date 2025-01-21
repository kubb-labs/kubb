import useSWR from 'swr'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../swr-client.ts'
import type { LoginUserQueryResponse, LoginUserQueryParams, LoginUser400 } from '../../../models/ts/userController/LoginUser.ts'
import { loginUser } from '../../axios/userService/loginUser.ts'

export const loginUserQueryKeySWR = (params?: LoginUserQueryParams) => [{ url: '/user/login' }, ...(params ? [params] : [])] as const

export type LoginUserQueryKeySWR = ReturnType<typeof loginUserQueryKeySWR>

export function loginUserQueryOptionsSWR({ params }: { params?: LoginUserQueryParams }, config: Partial<RequestConfig> = {}) {
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
    query?: Parameters<typeof useSWR<ResponseConfig<LoginUserQueryResponse>, ResponseErrorConfig<LoginUser400>, LoginUserQueryKeySWR | null, any>>[2]
    client?: Partial<RequestConfig>
    shouldFetch?: boolean
  } = {},
) {
  const { query: queryOptions, client: config = {}, shouldFetch = true } = options ?? {}

  const queryKey = loginUserQueryKeySWR(params)

  return useSWR<ResponseConfig<LoginUserQueryResponse>, ResponseErrorConfig<LoginUser400>, LoginUserQueryKeySWR | null>(shouldFetch ? queryKey : null, {
    ...loginUserQueryOptionsSWR({ params }, config),
    ...queryOptions,
  })
}
