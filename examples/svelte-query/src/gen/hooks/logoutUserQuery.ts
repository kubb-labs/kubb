import client from '@kubb/plugin-client/client'
import type { LogoutUserQueryResponse } from '../models/LogoutUser.ts'
import type {
  CreateBaseQueryOptions,
  CreateQueryResult,
  QueryKey,
  CreateInfiniteQueryOptions,
  CreateInfiniteQueryResult,
  InfiniteData,
} from '@tanstack/svelte-query'
import { createQuery, queryOptions, createInfiniteQuery, infiniteQueryOptions } from '@tanstack/svelte-query'

type LogoutUserClient = typeof client<LogoutUserQueryResponse, never, never>

type LogoutUser = {
  data: LogoutUserQueryResponse
  error: never
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

export function logoutUserQueryOptions(options: LogoutUser['client']['parameters'] = {}) {
  const queryKey = logoutUserQueryKey()
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<LogoutUser['data'], LogoutUser['error']>({
        method: 'get',
        url: `/user/logout`,
        ...options,
      })
      return res.data
    },
  })
}

/**
 * @summary Logs out current logged in user session
 * @link /user/logout
 */
export function logoutUserQuery<TData = LogoutUser['response'], TQueryData = LogoutUser['response'], TQueryKey extends QueryKey = LogoutUserQueryKey>(
  options: {
    query?: Partial<CreateBaseQueryOptions<LogoutUser['response'], LogoutUser['error'], TData, TQueryData, TQueryKey>>
    client?: LogoutUser['client']['parameters']
  } = {},
): CreateQueryResult<TData, LogoutUser['error']> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? logoutUserQueryKey()
  const query = createQuery({
    ...(logoutUserQueryOptions(clientOptions) as unknown as CreateBaseQueryOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<CreateBaseQueryOptions, 'queryKey'>),
  }) as CreateQueryResult<TData, LogoutUser['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}

export const logoutUserInfiniteQueryKey = () => [{ url: '/user/logout' }] as const

export type LogoutUserInfiniteQueryKey = ReturnType<typeof logoutUserInfiniteQueryKey>

export function logoutUserInfiniteQueryOptions(options: LogoutUser['client']['parameters'] = {}) {
  const queryKey = logoutUserInfiniteQueryKey()
  return infiniteQueryOptions({
    queryKey,
    queryFn: async ({ pageParam }) => {
      const res = await client<LogoutUser['data'], LogoutUser['error']>({
        method: 'get',
        url: `/user/logout`,
        ...options,
      })
      return res.data
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => (Array.isArray(lastPage) && lastPage.length === 0 ? undefined : lastPageParam + 1),
    getPreviousPageParam: (_firstPage, _allPages, firstPageParam) => (firstPageParam <= 1 ? undefined : firstPageParam - 1),
  })
}

/**
 * @summary Logs out current logged in user session
 * @link /user/logout
 */
export function logoutUserQueryInfinite<
  TData = InfiniteData<LogoutUser['response']>,
  TQueryData = LogoutUser['response'],
  TQueryKey extends QueryKey = LogoutUserInfiniteQueryKey,
>(
  options: {
    query?: Partial<CreateInfiniteQueryOptions<LogoutUser['response'], LogoutUser['error'], TData, TQueryData, TQueryKey>>
    client?: LogoutUser['client']['parameters']
  } = {},
): CreateInfiniteQueryResult<TData, LogoutUser['error']> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? logoutUserInfiniteQueryKey()
  const query = createInfiniteQuery({
    ...(logoutUserInfiniteQueryOptions(clientOptions) as unknown as CreateInfiniteQueryOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<CreateInfiniteQueryOptions, 'queryKey'>),
  }) as CreateInfiniteQueryResult<TData, LogoutUser['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
