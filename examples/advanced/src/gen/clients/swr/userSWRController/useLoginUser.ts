import client from '../../../../swr-client.ts'
import useSWR from 'swr'
import type { RequestConfig } from '../../../../swr-client.ts'
import type { LoginUserQueryResponse, LoginUserQueryParams, LoginUser400 } from '../../../models/ts/userController/LoginUser.ts'
import type { SWRConfiguration } from 'swr'
import { loginUserQueryResponseSchema } from '../../../zod/userController/loginUserSchema.ts'

/**
 * @summary Logs user into the system
 * @link /user/login
 */
async function loginUser(params?: LoginUserQueryParams, config: Partial<RequestConfig> = {}) {
  const res = await client<LoginUserQueryResponse, LoginUser400, unknown>({
    method: 'get',
    url: '/user/login',
    baseURL: 'https://petstore3.swagger.io/api/v3',
    params,
    ...config,
  })
  return { ...res, data: loginUserQueryResponseSchema.parse(res.data) }
}

export function loginUserQueryOptions(params?: LoginUserQueryParams, config: Partial<RequestConfig> = {}) {
  return {
    fetcher: async () => {
      return loginUser(params, config)
    },
  }
}

/**
 * @summary Logs user into the system
 * @link /user/login
 */
export function useLoginUser<TData = LoginUserQueryResponse>(
  params?: LoginUserQueryParams,
  options: {
    query?: SWRConfiguration<TData, LoginUser400>
    client?: Partial<RequestConfig>
    shouldFetch?: boolean
  } = {},
) {
  const { query: queryOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const url = '/user/login'
  return useSWR<TData, LoginUser400, typeof url | null>(shouldFetch ? url : null, {
    ...loginUserQueryOptions(params, config),
    ...queryOptions,
  })
}
