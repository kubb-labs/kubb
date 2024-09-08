import client from '@kubb/plugin-client/client'
import useSWR from 'swr'
import type { LoginUserQueryResponse, LoginUserQueryParams, LoginUser400 } from '../models/LoginUser.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'
import type { SWRConfiguration, SWRResponse } from 'swr'

type LoginUserClient = typeof client<LoginUserQueryResponse, LoginUser400, never>

type LoginUser = {
  data: LoginUserQueryResponse
  error: LoginUser400
  request: never
  pathParams: never
  queryParams: LoginUserQueryParams
  headerParams: never
  response: LoginUserQueryResponse
  client: {
    parameters: Partial<Parameters<LoginUserClient>[0]>
    return: Awaited<ReturnType<LoginUserClient>>
  }
}

export function loginUserQueryOptions<TData = LoginUser['response']>(
  params?: LoginUserQueryParams,
  config: Partial<RequestConfig> = {},
): SWRConfiguration<TData, LoginUser['error']> {
  return {
    fetcher: async () => {
      const res = await client<LoginUserQueryResponse>({ method: 'get', url: '/user/login', baseURL: 'https://petstore3.swagger.io/api/v3', params, ...config })
      return res.data
    },
  }
}

/**
 * @summary Logs user into the system
 * @link /user/login
 */
export function useLoginUser<TData = LoginUser['response']>(
  params?: LoginUser['queryParams'],
  options?: {
    query?: SWRConfiguration<TData, LoginUser['error']>
    client?: LoginUser['client']['parameters']
    shouldFetch?: boolean
  },
): SWRResponse<TData, LoginUser['error']> {
  const { query: queryOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}
  const url = '/user/login'
  const query = useSWR<TData, LoginUser['error'], typeof url | null>(shouldFetch ? url : null, {
    ...loginUserQueryOptions<TData>(params, clientOptions),
    ...queryOptions,
  })
  return query
}
