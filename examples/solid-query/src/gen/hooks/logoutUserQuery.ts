import client from '@kubb/swagger-client/client'
import { createQuery } from '@tanstack/solid-query'
import type { LogoutUserQueryResponse, LogoutUserError } from '../models/LogoutUser'
import type { CreateBaseQueryOptions, CreateQueryResult, QueryKey } from '@tanstack/solid-query'

type LogoutUserClient = typeof client<LogoutUserQueryResponse, LogoutUserError, never>
type LogoutUser = {
  data: LogoutUserQueryResponse
  error: LogoutUserError
  request: never
  pathParams: never
  queryParams: never
  headerParams: never
  response: Awaited<ReturnType<LogoutUserClient>>['data']
  unionResponse: Awaited<ReturnType<LogoutUserClient>> | Awaited<ReturnType<LogoutUserClient>>['data']
  client: {
    paramaters: Partial<Parameters<LogoutUserClient>[0]>
    return: Awaited<ReturnType<LogoutUserClient>>
  }
}
export const logoutUserQueryKey = () => [{ url: '/user/logout' }] as const
export type LogoutUserQueryKey = ReturnType<typeof logoutUserQueryKey>
export function logoutUserQueryOptions<
  TQueryFnData extends LogoutUser['data'] = LogoutUser['data'],
  TError = LogoutUser['error'],
  TData = LogoutUser['response'],
  TQueryData = LogoutUser['response'],
>(options: LogoutUser['client']['paramaters'] = {}): CreateBaseQueryOptions<LogoutUser['unionResponse'], TError, TData, TQueryData, LogoutUserQueryKey> {
  const queryKey = logoutUserQueryKey()
  return {
    queryKey,
    queryFn: () => {
      return client<TQueryFnData, TError>({
        method: 'get',
        url: `/user/logout`,
        ...options,
      }).then((res) => res?.data || res)
    },
  }
}
/**
 * @summary Logs out current logged in user session
 * @link /user/logout */
export function logoutUserQuery<
  TQueryFnData extends LogoutUser['data'] = LogoutUser['data'],
  TError = LogoutUser['error'],
  TData = LogoutUser['response'],
  TQueryData = LogoutUser['response'],
  TQueryKey extends QueryKey = LogoutUserQueryKey,
>(
  options: {
    query?: CreateBaseQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
    client?: LogoutUser['client']['paramaters']
  } = {},
): CreateQueryResult<TData, TError> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? logoutUserQueryKey()
  const query = createQuery<TQueryFnData, TError, TData, any>({
    ...logoutUserQueryOptions<TQueryFnData, TError, TData, TQueryData>(clientOptions),
    queryKey,
    ...queryOptions,
  }) as CreateQueryResult<TData, TError> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
