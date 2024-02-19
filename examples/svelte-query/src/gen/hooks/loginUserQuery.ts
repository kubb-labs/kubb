import client from '@kubb/swagger-client/client'
import { createQuery, createInfiniteQuery } from '@tanstack/svelte-query'
import type { LoginUserQueryResponse, LoginUserQueryParams, LoginUser400 } from '../models/LoginUser'
import type {
  CreateBaseQueryOptions,
  CreateQueryResult,
  QueryKey,
  WithRequired,
  CreateInfiniteQueryOptions,
  CreateInfiniteQueryResult,
  InfiniteData,
} from '@tanstack/svelte-query'

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
export function loginUserQueryOptions<TData = LoginUser['response'], TQueryData = LoginUser['response']>(
  params?: LoginUser['queryParams'],
  options: LoginUser['client']['parameters'] = {},
): WithRequired<CreateBaseQueryOptions<LoginUser['response'], LoginUser['error'], TData, TQueryData>, 'queryKey'> {
  const queryKey = loginUserQueryKey(params)

  return {
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
  }
}
/**
 * @summary Logs user into the system
 * @link /user/login */

export function loginUserQuery<TData = LoginUser['response'], TQueryData = LoginUser['response'], TQueryKey extends QueryKey = LoginUserQueryKey>(
  params?: LoginUser['queryParams'],
  options: {
    query?: Partial<CreateBaseQueryOptions<LoginUser['response'], LoginUser['error'], TData, TQueryData, TQueryKey>>
    client?: LoginUser['client']['parameters']
  } = {},
): CreateQueryResult<TData, LoginUser['error']> & { queryKey: TQueryKey } {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? loginUserQueryKey(params)

  const query = createQuery<LoginUser['data'], LoginUser['error'], TData, any>({
    ...loginUserQueryOptions<TData, TQueryData>(params, clientOptions),
    queryKey,
    ...queryOptions,
  }) as CreateQueryResult<TData, LoginUser['error']> & { queryKey: TQueryKey }

  query.queryKey = queryKey as TQueryKey

  return query
}
export const loginUserInfiniteQueryKey = (params?: LoginUser['queryParams']) => [{ url: '/user/login' }, ...(params ? [params] : [])] as const
export type LoginUserInfiniteQueryKey = ReturnType<typeof loginUserInfiniteQueryKey>
export function loginUserInfiniteQueryOptions<TData = LoginUser['response'], TQueryData = LoginUser['response']>(
  params?: LoginUser['queryParams'],
  options: LoginUser['client']['parameters'] = {},
): WithRequired<CreateInfiniteQueryOptions<LoginUser['response'], LoginUser['error'], TData, TQueryData>, 'queryKey'> {
  const queryKey = loginUserInfiniteQueryKey(params)

  return {
    queryKey,
    queryFn: async ({ pageParam }) => {
      const res = await client<LoginUser['data'], LoginUser['error']>({
        method: 'get',
        url: `/user/login`,
        ...options,
        params: {
          ...params,
          ['id']: pageParam,
          ...(options.params || {}),
        },
      })

      return res.data
    },
  }
}
/**
 * @summary Logs user into the system
 * @link /user/login */

export function loginUserQueryInfinite<
  TData = InfiniteData<LoginUser['response']>,
  TQueryData = LoginUser['response'],
  TQueryKey extends QueryKey = LoginUserInfiniteQueryKey,
>(
  params?: LoginUser['queryParams'],
  options: {
    query?: Partial<CreateInfiniteQueryOptions<LoginUser['response'], LoginUser['error'], TData, TQueryData, TQueryKey>>
    client?: LoginUser['client']['parameters']
  } = {},
): CreateInfiniteQueryResult<TData, LoginUser['error']> & { queryKey: TQueryKey } {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? loginUserInfiniteQueryKey(params)

  const query = createInfiniteQuery<LoginUser['data'], LoginUser['error'], TData, any>({
    ...loginUserInfiniteQueryOptions<TData, TQueryData>(params, clientOptions),
    queryKey,
    ...queryOptions,
  }) as CreateInfiniteQueryResult<TData, LoginUser['error']> & { queryKey: TQueryKey }

  query.queryKey = queryKey as TQueryKey

  return query
}
