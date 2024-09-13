import client from '@kubb/plugin-client/client'
import type { LogoutUserQueryResponse } from '../models/LogoutUser.ts'
import type { CreateBaseQueryOptions, CreateQueryResult, QueryKey } from '@tanstack/solid-query'
import { createQuery, queryOptions } from '@tanstack/solid-query'

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
  const query = createQuery(() => ({
    ...(logoutUserQueryOptions(clientOptions) as unknown as CreateBaseQueryOptions),
    queryKey,
    initialData: undefined,
    ...(queryOptions as unknown as Omit<CreateBaseQueryOptions, 'queryKey'>),
  })) as CreateQueryResult<TData, LogoutUser['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
