import client from '@kubb/plugin-client/clients/axios'
import useSWR from 'swr'
import type { LoginUserQueryResponse, LoginUserQueryParams, LoginUser400 } from '../models/LoginUser.ts'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'

export const loginUserQueryKey = (params?: LoginUserQueryParams) => [{ url: '/user/login' }, ...(params ? [params] : [])] as const

export type LoginUserQueryKey = ReturnType<typeof loginUserQueryKey>

/**
 * @summary Logs user into the system
 * {@link /user/login}
 */
export async function loginUser(params?: LoginUserQueryParams, config: Partial<RequestConfig> & { client?: typeof client } = {}) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<LoginUserQueryResponse, ResponseErrorConfig<LoginUser400>, unknown>({ method: 'GET', url: '/user/login', params, ...requestConfig })
  return res.data
}

export function loginUserQueryOptions(params?: LoginUserQueryParams, config: Partial<RequestConfig> & { client?: typeof client } = {}) {
  return {
    fetcher: async () => {
      return loginUser(params, config)
    },
  }
}

/**
 * @summary Logs user into the system
 * {@link /user/login}
 */
export function useLoginUser(
  params?: LoginUserQueryParams,
  options: {
    query?: Parameters<typeof useSWR<LoginUserQueryResponse, ResponseErrorConfig<LoginUser400>, LoginUserQueryKey | null, any>>[2]
    client?: Partial<RequestConfig> & { client?: typeof client }
    shouldFetch?: boolean
  } = {},
) {
  const { query: queryOptions, client: config = {}, shouldFetch = true } = options ?? {}

  const queryKey = loginUserQueryKey(params)

  return useSWR<LoginUserQueryResponse, ResponseErrorConfig<LoginUser400>, LoginUserQueryKey | null>(shouldFetch ? queryKey : null, {
    ...loginUserQueryOptions(params, config),
    ...queryOptions,
  })
}
