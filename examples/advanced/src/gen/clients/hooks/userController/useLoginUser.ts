import {
  useQuery,
  QueryKey,
  UseQueryResult,
  UseQueryOptions,
  QueryOptions,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
  useInfiniteQuery,
} from '@tanstack/react-query'
import client from '../../../../client'
import type { LoginUserQueryResponse, LoginuserQueryparams, Loginuser400 } from '../../../models/ts/userController/LoginUser'

export const loginUserQueryKey = (params?: LoginuserQueryparams) => [`/user/login`, ...(params ? [params] : [])] as const

export function loginUserQueryOptions<TData = LoginUserQueryResponse, TError = Loginuser400>(
  params?: LoginuserQueryparams,
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
      })
    },
  }
}

/**
 * @summary Logs user into the system
 * @link /user/login
 */

export function useLoginuser<TData = LoginUserQueryResponse, TError = Loginuser400>(
  params?: LoginuserQueryparams,
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

export function loginUserQueryOptionsInfinite<TData = LoginUserQueryResponse, TError = Loginuser400>(
  params?: LoginuserQueryparams,
  options: Partial<Parameters<typeof client>[0]> = {},
): UseInfiniteQueryOptions<TData, TError> {
  const queryKey = loginUserQueryKey(params)

  return {
    queryKey,
    queryFn: ({ pageParam }) => {
      return client<TData, TError>({
        method: 'get',
        url: `/user/login`,

        ...options,
        params: {
          ...params,
          ['id']: pageParam,
          ...(options.params || {}),
        },
      })
    },
  }
}

/**
 * @summary Logs user into the system
 * @link /user/login
 */

export function useLoginuserInfinite<TData = LoginUserQueryResponse, TError = Loginuser400>(
  params?: LoginuserQueryparams,
  options: {
    query?: UseInfiniteQueryOptions<TData, TError>
    client?: Partial<Parameters<typeof client<TData, TError>>[0]>
  } = {},
): UseInfiniteQueryResult<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? loginUserQueryKey(params)

  const query = useInfiniteQuery<TData, TError>({
    ...loginUserQueryOptionsInfinite<TData, TError>(params, clientOptions),
    ...queryOptions,
  }) as UseInfiniteQueryResult<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey as QueryKey

  return query
}
