import client from '@kubb/swagger-client/client'
import { useQuery, useInfiniteQuery, useSuspenseQuery } from '@tanstack/react-query'
import type { LoginUserQueryResponse, LoginUserQueryParams, LoginUser400 } from '../models/LoginUser'
import type {
  QueryObserverOptions,
  UseQueryResult,
  QueryKey,
  WithRequired,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
  UseSuspenseQueryOptions,
  UseSuspenseQueryResult,
} from '@tanstack/react-query'

type LoginUserClient = typeof client<LoginUserQueryResponse, LoginUser400, never>
type LoginUser = {
  data: LoginUserQueryResponse
  error: LoginUser400
  request: never
  pathParams: never
  queryParams: LoginUserQueryParams
  headerParams: never
  response: LoginUserQueryResponse
  unionResponse: Awaited<ReturnType<LoginUserClient>> | LoginUserQueryResponse
  client: {
    paramaters: Partial<Parameters<LoginUserClient>[0]>
    return: Awaited<ReturnType<LoginUserClient>>
  }
}
export const loginUserQueryKey = (params?: LoginUser['queryParams']) => [{ url: '/user/login' }, ...(params ? [params] : [])] as const
export type LoginUserQueryKey = ReturnType<typeof loginUserQueryKey>
export function loginUserQueryOptions<
  TQueryFnData extends LoginUser['data'] = LoginUser['data'],
  TError = LoginUser['error'],
  TData = LoginUser['response'],
  TQueryData = LoginUser['response'],
>(
  params?: LoginUser['queryParams'],
  options: LoginUser['client']['paramaters'] = {},
): WithRequired<QueryObserverOptions<LoginUser['unionResponse'], TError, TData, TQueryData>, 'queryKey'> {
  const queryKey = loginUserQueryKey(params)
  return {
    queryKey,
    queryFn: () => {
      return client<TQueryFnData, TError>({
        method: 'get',
        url: `/user/login`,
        params,
        ...options,
      }).then(res => res?.data || res)
    },
  }
}
/**
 * @summary Logs user into the system
 * @link /user/login */
export function useLoginUserHook<
  TQueryFnData extends LoginUser['data'] = LoginUser['data'],
  TError = LoginUser['error'],
  TData = LoginUser['response'],
  TQueryData = LoginUser['response'],
  TQueryKey extends QueryKey = LoginUserQueryKey,
>(params?: LoginUser['queryParams'], options: {
  query?: QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
  client?: LoginUser['client']['paramaters']
} = {}): UseQueryResult<TData, TError> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? loginUserQueryKey(params)
  const query = useQuery<any, TError, TData, any>({
    ...loginUserQueryOptions<TQueryFnData, TError, TData, TQueryData>(params, clientOptions),
    queryKey,
    ...queryOptions,
  }) as UseQueryResult<TData, TError> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
export const loginUserInfiniteQueryKey = (params?: LoginUser['queryParams']) => [{ url: '/user/login' }, ...(params ? [params] : [])] as const
export type LoginUserInfiniteQueryKey = ReturnType<typeof loginUserInfiniteQueryKey>
export function loginUserInfiniteQueryOptions<
  TQueryFnData extends LoginUser['data'] = LoginUser['data'],
  TError = LoginUser['error'],
  TData = LoginUser['response'],
  TQueryData = LoginUser['response'],
>(
  params?: LoginUser['queryParams'],
  options: LoginUser['client']['paramaters'] = {},
): WithRequired<UseInfiniteQueryOptions<LoginUser['unionResponse'], TError, TData, TQueryData>, 'queryKey'> {
  const queryKey = loginUserInfiniteQueryKey(params)
  return {
    queryKey,
    queryFn: ({ pageParam }) => {
      return client<TQueryFnData, TError>({
        method: 'get',
        url: `/user/login`,
        ...options,
        params: {
          ...params,
          ['id']: pageParam,
          ...(options.params || {}),
        },
      }).then(res => res?.data || res)
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage['id'],
  }
}
/**
 * @summary Logs user into the system
 * @link /user/login */
export function useLoginUserHookInfinite<
  TQueryFnData extends LoginUser['data'] = LoginUser['data'],
  TError = LoginUser['error'],
  TData = LoginUser['response'],
  TQueryData = LoginUser['response'],
  TQueryKey extends QueryKey = LoginUserInfiniteQueryKey,
>(params?: LoginUser['queryParams'], options: {
  query?: UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
  client?: LoginUser['client']['paramaters']
} = {}): UseInfiniteQueryResult<TData, TError> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? loginUserInfiniteQueryKey(params)
  const query = useInfiniteQuery<any, TError, TData, any>({
    ...loginUserInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryData>(params, clientOptions),
    queryKey,
    ...queryOptions,
  }) as UseInfiniteQueryResult<TData, TError> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
export const loginUserSuspenseQueryKey = (params?: LoginUser['queryParams']) => [{ url: '/user/login' }, ...(params ? [params] : [])] as const
export type LoginUserSuspenseQueryKey = ReturnType<typeof loginUserSuspenseQueryKey>
export function loginUserSuspenseQueryOptions<
  TQueryFnData extends LoginUser['data'] = LoginUser['data'],
  TError = LoginUser['error'],
  TData = LoginUser['response'],
>(
  params?: LoginUser['queryParams'],
  options: LoginUser['client']['paramaters'] = {},
): WithRequired<UseSuspenseQueryOptions<LoginUser['unionResponse'], TError, TData>, 'queryKey'> {
  const queryKey = loginUserSuspenseQueryKey(params)
  return {
    queryKey,
    queryFn: () => {
      return client<TQueryFnData, TError>({
        method: 'get',
        url: `/user/login`,
        params,
        ...options,
      }).then(res => res?.data || res)
    },
  }
}
/**
 * @summary Logs user into the system
 * @link /user/login */
export function useLoginUserHookSuspense<
  TQueryFnData extends LoginUser['data'] = LoginUser['data'],
  TError = LoginUser['error'],
  TData = LoginUser['response'],
  TQueryKey extends QueryKey = LoginUserSuspenseQueryKey,
>(params?: LoginUser['queryParams'], options: {
  query?: UseSuspenseQueryOptions<TQueryFnData, TError, TData, TQueryKey>
  client?: LoginUser['client']['paramaters']
} = {}): UseSuspenseQueryResult<TData, TError> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? loginUserSuspenseQueryKey(params)
  const query = useSuspenseQuery<any, TError, TData, any>({
    ...loginUserSuspenseQueryOptions<TQueryFnData, TError, TData>(params, clientOptions),
    queryKey,
    ...queryOptions,
  }) as UseSuspenseQueryResult<TData, TError> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
