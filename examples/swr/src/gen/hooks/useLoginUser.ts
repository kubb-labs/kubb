import client from '@kubb/plugin-client/client'
import useSWR from 'swr'
import type { LoginUserQueryResponse, LoginUserQueryParams, LoginUser400 } from '../models/LoginUser.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'
import type { Key, SWRConfiguration } from 'swr'

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
  return res.data
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
export function useLoginUser(
  params?: LoginUserQueryParams,
  options: {
    query?: SWRConfiguration<LoginUserQueryResponse, LoginUser400>
    client?: Partial<RequestConfig>
    shouldFetch?: boolean
  } = {},
) {
  const { query: queryOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const swrKey = ['/user/login', params] as const
  return useSWR<LoginUserQueryResponse, LoginUser400, Key>(shouldFetch ? swrKey : null, {
    ...loginUserQueryOptions(params, config),
    ...queryOptions,
  })
}
