import client from '@kubb/plugin-client/client'
import type { LoginUserQueryResponse, LoginUserQueryParams, LoginUser400 } from '../models/LoginUser.ts'
import type { CreateBaseQueryOptions, CreateQueryResult, QueryKey } from '@tanstack/solid-query'
import { createQuery, queryOptions } from '@tanstack/solid-query'

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

export const loginUserQueryKey = (params?: LoginUser['queryParams']) => [{ url: '/user/login' }, ...(params ? [params] : [])] as const

export type LoginUserQueryKey = ReturnType<typeof loginUserQueryKey>

export function loginUserQueryOptions(params?: LoginUser['queryParams'], options: LoginUser['client']['parameters'] = {}) {
  const queryKey = loginUserQueryKey(params)
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<LoginUser['data'], LoginUser['error']>({
        method: 'get',
        url: `/user/login`,
        params,
        ...options,
      })
      return res.data
    },
  })
}

/**
 * @summary Logs user into the system
 * @link /user/login
 */
export function loginUserQuery<TData = LoginUser['response'], TQueryData = LoginUser['response'], TQueryKey extends QueryKey = LoginUserQueryKey>(
  params?: LoginUser['queryParams'],
  options: {
    query?: Partial<CreateBaseQueryOptions<LoginUser['response'], LoginUser['error'], TData, TQueryData, TQueryKey>>
    client?: LoginUser['client']['parameters']
  } = {},
): CreateQueryResult<TData, LoginUser['error']> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? loginUserQueryKey(params)
  const query = createQuery(() => ({
    ...(loginUserQueryOptions(params, clientOptions) as unknown as CreateBaseQueryOptions),
    queryKey,
    initialData: undefined,
    ...(queryOptions as unknown as Omit<CreateBaseQueryOptions, 'queryKey'>),
  })) as CreateQueryResult<TData, LoginUser['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
