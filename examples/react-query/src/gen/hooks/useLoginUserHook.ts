import type { QueryKey, UseQueryResult, UseQueryOptions, QueryOptions } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'
import client from '@kubb/swagger-client/client'
import type { LoginUserQueryResponse, LoginUserQueryParams, LoginUser400 } from '../models/LoginUser'

export const loginUserQueryKey = (params?: LoginUserQueryParams) => [{ url: `/user/login` }, ...(params ? [params] : [])] as const

export function loginUserQueryOptions<TData = LoginUserQueryResponse, TError = LoginUser400>(
  params?: LoginUserQueryParams,
  options: Partial<Parameters<typeof client>[0]> = {},
): UseQueryOptions<TData, TError> {
  const queryKey = loginUserQueryKey(params)

  return {
    queryKey,
    queryFn: () => {
      return client<TData, TError>({
        method: 'get',
        url: `/user/login`,
        params,

        ...options,
      }).then((res) => res.data)
    },
  }
}

/**
 * @summary Logs user into the system
 * @link /user/login
 */

export function useLoginUserHook<TData = LoginUserQueryResponse, TError = LoginUser400>(
  params?: LoginUserQueryParams,
  options: {
    query?: UseQueryOptions<TData, TError>
    client?: Partial<Parameters<typeof client<TData, TError>>[0]>
  } = {},
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? loginUserQueryKey(params)

  const query = useQuery<TData, TError>({
    ...loginUserQueryOptions<TData, TError>(params, clientOptions),
    ...queryOptions,
  }) as UseQueryResult<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey as QueryKey

  return query
}
