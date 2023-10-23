import type {
  QueryKey,
  UseQueryResult,
  UseQueryOptions,
  QueryObserverOptions,
  UseInfiniteQueryOptions,
  InfiniteQueryObserverOptions,
  UseInfiniteQueryResult,
  InfiniteData,
} from '@tanstack/react-query'
import { useQuery, queryOptions, infiniteQueryOptions, useInfiniteQuery } from '@tanstack/react-query'
import client from '@kubb/swagger-client/client'
import type { LoginUserQueryResponse, LoginUserQueryParams, LoginUser400 } from '../models/LoginUser'

export const loginUserQueryKey = (params?: LoginUserQueryParams) => [{ url: `/user/login` }, ...(params ? [params] : [])] as const
export function loginUserQueryOptions<TData = LoginUserQueryResponse, TError = LoginUser400>(
  params?: LoginUserQueryParams,
  options: Partial<Parameters<typeof client>[0]> = {},
): UseQueryOptions<TData, TError> {
  const queryKey = loginUserQueryKey(params)

  return queryOptions<TData, TError>({
    queryKey: queryKey as QueryKey,
    queryFn: () => {
      return client<TData, TError>({
        method: 'get',
        url: `/user/login`,
        params,

        ...options,
      }).then(res => res.data)
    },
  })
}

/**
 * @summary Logs user into the system
 * @link /user/login
 */

export function useLoginUserHook<TData = LoginUserQueryResponse, TError = LoginUser400>(params?: LoginUserQueryParams, options: {
  query?: QueryObserverOptions<TData, TError>
  client?: Partial<Parameters<typeof client<TData, TError>>[0]>
} = {}): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? loginUserQueryKey(params)

  const query = useQuery<TData, TError>({
    ...loginUserQueryOptions<TData, TError>(params, clientOptions),
    ...queryOptions,
  }) as UseQueryResult<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey as QueryKey

  return query
}

export function loginUserQueryOptionsInfinite<
  TData = LoginUserQueryResponse,
  TError = LoginUser400,
  TInfiniteDate = InfiniteData<LoginUserQueryResponse extends [] ? LoginUserQueryResponse[number] : LoginUserQueryResponse>,
>(params?: LoginUserQueryParams, options: Partial<Parameters<typeof client>[0]> = {}): UseInfiniteQueryOptions<TData, TError, TInfiniteDate> {
  const queryKey = loginUserQueryKey(params)

  return infiniteQueryOptions<TData, TError, TInfiniteDate>({
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
      }).then(res => res.data)
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage['id'],
  })
}

/**
 * @summary Logs user into the system
 * @link /user/login
 */

export function useLoginUserHookInfinite<
  TData = LoginUserQueryResponse,
  TError = LoginUser400,
  TInfiniteDate = InfiniteData<LoginUserQueryResponse extends [] ? LoginUserQueryResponse[number] : LoginUserQueryResponse>,
>(params?: LoginUserQueryParams, options: {
  query?: InfiniteQueryObserverOptions<TData, TError, TInfiniteDate>
  client?: Partial<Parameters<typeof client<TData, TError>>[0]>
} = {}): UseInfiniteQueryResult<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? loginUserQueryKey(params)

  const query = useInfiniteQuery<TData, TError, TInfiniteDate>({
    ...loginUserQueryOptionsInfinite<TData, TError, TInfiniteDate>(params, clientOptions),
    ...queryOptions,
  }) as UseInfiniteQueryResult<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey as QueryKey

  return query
}
