import client from '@kubb/swagger-client/client'
import { createQuery, createInfiniteQuery } from '@tanstack/svelte-query'
import type { LogoutUserQueryResponse, LogoutUserError } from '../models/LogoutUser'
import type {
  CreateBaseQueryOptions,
  CreateQueryResult,
  QueryKey,
  WithRequired,
  CreateInfiniteQueryOptions,
  CreateInfiniteQueryResult,
} from '@tanstack/svelte-query'

type LogoutUserClient = typeof client<LogoutUserQueryResponse, LogoutUserError, never>
type LogoutUser = {
  data: LogoutUserQueryResponse
  error: LogoutUserError
  request: never
  pathParams: never
  queryParams: never
  headerParams: never
  response: LogoutUserQueryResponse
  client: {
    parameters: Partial<Parameters<LogoutUserClient>[0]>
    return: Awaited<ReturnType<LogoutUserClient>>
  }
}
export const logoutUserQueryKey = () => [{ url: '/user/logout' }] as const
export type LogoutUserQueryKey = ReturnType<typeof logoutUserQueryKey>
export function logoutUserQueryOptions<TData = LogoutUser['response'], TQueryData = LogoutUser['response']>(
  options: LogoutUser['client']['parameters'] = {},
): WithRequired<CreateBaseQueryOptions<LogoutUser['response'], LogoutUser['error'], TData, TQueryData>, 'queryKey'> {
  const queryKey = logoutUserQueryKey()
  return {
    queryKey,
    queryFn: async () => {
      const res = await client<LogoutUser['data'], LogoutUser['error']>({
        method: 'get',
        url: `/user/logout`,
        ...options,
      })
      return res.data
    },
  }
}
/**
 * @summary Logs out current logged in user session
 * @link /user/logout */
export function logoutUserQuery<TData = LogoutUser['response'], TQueryData = LogoutUser['response'], TQueryKey extends QueryKey = LogoutUserQueryKey>(
  options: {
    query?: CreateBaseQueryOptions<LogoutUser['data'], LogoutUser['error'], TData, TQueryData, TQueryKey>
    client?: LogoutUser['client']['parameters']
  } = {},
): CreateQueryResult<TData, LogoutUser['error']> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? logoutUserQueryKey()
  const query = createQuery<LogoutUser['data'], LogoutUser['error'], TData, any>({
    ...logoutUserQueryOptions<TData, TQueryData>(clientOptions),
    queryKey,
    ...queryOptions,
  }) as CreateQueryResult<TData, LogoutUser['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
export const logoutUserInfiniteQueryKey = () => [{ url: '/user/logout' }] as const
export type LogoutUserInfiniteQueryKey = ReturnType<typeof logoutUserInfiniteQueryKey>
export function logoutUserInfiniteQueryOptions<TData = LogoutUser['response'], TQueryData = LogoutUser['response']>(
  options: LogoutUser['client']['parameters'] = {},
): WithRequired<CreateInfiniteQueryOptions<LogoutUser['response'], LogoutUser['error'], TData, TQueryData>, 'queryKey'> {
  const queryKey = logoutUserInfiniteQueryKey()
  return {
    queryKey,
    queryFn: async ({ pageParam }) => {
      const res = await client<LogoutUser['data'], LogoutUser['error']>({
        method: 'get',
        url: `/user/logout`,
        ...options,
      })
      return res.data
    },
  }
}
/**
 * @summary Logs out current logged in user session
 * @link /user/logout */
export function logoutUserQueryInfinite<
  TData = LogoutUser['response'],
  TQueryData = LogoutUser['response'],
  TQueryKey extends QueryKey = LogoutUserInfiniteQueryKey,
>(
  options: {
    query?: CreateInfiniteQueryOptions<LogoutUser['data'], LogoutUser['error'], TData, TQueryData, TQueryKey>
    client?: LogoutUser['client']['parameters']
  } = {},
): CreateInfiniteQueryResult<TData, LogoutUser['error']> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? logoutUserInfiniteQueryKey()
  const query = createInfiniteQuery<LogoutUser['data'], LogoutUser['error'], TData, any>({
    ...logoutUserInfiniteQueryOptions<TData, TQueryData>(clientOptions),
    queryKey,
    ...queryOptions,
  }) as CreateInfiniteQueryResult<TData, LogoutUser['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
