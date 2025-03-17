import client from '@kubb/plugin-client/clients/axios'
import type { LoginUserQueryResponse, LoginUserQueryParams, LoginUser400 } from '../models/LoginUser.ts'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { QueryKey, CreateBaseQueryOptions, CreateQueryResult } from '@tanstack/svelte-query'
import { queryOptions, createQuery } from '@tanstack/svelte-query'

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
  const queryKey = loginUserQueryKey(params)
  return queryOptions<LoginUserQueryResponse, ResponseErrorConfig<LoginUser400>, LoginUserQueryResponse, typeof queryKey>({
    queryKey,
    queryFn: async ({ signal }) => {
      config.signal = signal
      return loginUser(params, config)
    },
  })
}

/**
 * @summary Logs user into the system
 * {@link /user/login}
 */
export function createLoginUser<TData = LoginUserQueryResponse, TQueryData = LoginUserQueryResponse, TQueryKey extends QueryKey = LoginUserQueryKey>(
  params?: LoginUserQueryParams,
  options: {
    query?: Partial<CreateBaseQueryOptions<LoginUserQueryResponse, ResponseErrorConfig<LoginUser400>, TData, TQueryData, TQueryKey>>
    client?: Partial<RequestConfig> & { client?: typeof client }
  } = {},
) {
  const { query: queryOptions, client: config = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? loginUserQueryKey(params)

  const query = createQuery({
    ...(loginUserQueryOptions(params, config) as unknown as CreateBaseQueryOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<CreateBaseQueryOptions, 'queryKey'>),
  }) as CreateQueryResult<TData, ResponseErrorConfig<LoginUser400>> & { queryKey: TQueryKey }

  query.queryKey = queryKey as TQueryKey

  return query
}
