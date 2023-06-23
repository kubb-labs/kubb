import type { QueryKey, UseQueryResult, UseQueryOptions, UseInfiniteQueryOptions, UseInfiniteQueryResult } from '@tanstack/react-query'
import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import client from '../../../../client'
import type { LoginUserQueryResponse, LoginUserQueryParams, LoginUser400 } from '../../../models/ts/userController/LoginUser'

export const loginUserQueryKey = (params: LoginUserQueryParams) => [`/user/login`, ...(params ? [params] : [])] as const

export function loginUserQueryOptions<TData = LoginUserQueryResponse, TError = LoginUser400>(params: LoginUserQueryParams): UseQueryOptions<TData, TError> {
  const queryKey = loginUserQueryKey(params)

  return {
    queryKey,
    queryFn: () => {
      return client<TData, TError>({
        method: 'get',
        url: `/user/login`,
        params,
      })
    },
  }
}

/**
 * @summary Logs user into the system
 * @link /user/login
 */
export function useLoginUser<TData = LoginUserQueryResponse, TError = LoginUser400>(
  params: LoginUserQueryParams,
  options?: { query?: UseQueryOptions<TData, TError> }
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? loginUserQueryKey(params)

  const query = useQuery<TData, TError>({
    ...loginUserQueryOptions<TData, TError>(params),
    ...queryOptions,
  }) as UseQueryResult<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey

  return query
}

export function loginUserQueryOptionsInfinite<TData = LoginUserQueryResponse, TError = LoginUser400>(
  params: LoginUserQueryParams
): UseInfiniteQueryOptions<TData, TError> {
  const queryKey = loginUserQueryKey(params)

  return {
    queryKey,
    queryFn: ({ pageParam }) => {
      return client<TData, TError>({
        method: 'get',
        url: `/user/login`,
        params: {
          ...params,
          ['id']: pageParam,
        },
      })
    },
  }
}

/**
 * @summary Logs user into the system
 * @link /user/login
 */
export function useLoginUserInfinite<TData = LoginUserQueryResponse, TError = LoginUser400>(
  params: LoginUserQueryParams,
  options?: { query?: UseInfiniteQueryOptions<TData, TError> }
): UseInfiniteQueryResult<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? loginUserQueryKey(params)

  const query = useInfiniteQuery<TData, TError>({
    ...loginUserQueryOptionsInfinite<TData, TError>(params),
    ...queryOptions,
  }) as UseInfiniteQueryResult<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey

  return query
}
