import client from '@kubb/swagger-client/client'
import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import type { FindPetsByStatusQueryResponse, FindPetsByStatusQueryParams, FindPetsByStatus400 } from '../models/FindPetsByStatus'
import type {
  UseBaseQueryOptions,
  UseQueryResult,
  QueryKey,
  WithRequired,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
  InfiniteData,
} from '@tanstack/react-query'

type FindPetsByStatusClient = typeof client<FindPetsByStatusQueryResponse, FindPetsByStatus400, never>
type FindPetsByStatus = {
  data: FindPetsByStatusQueryResponse
  error: FindPetsByStatus400
  request: never
  pathParams: never
  queryParams: FindPetsByStatusQueryParams
  headerParams: never
  response: FindPetsByStatusQueryResponse
  client: {
    parameters: Partial<Parameters<FindPetsByStatusClient>[0]>
    return: Awaited<ReturnType<FindPetsByStatusClient>>
  }
}
export const findPetsByStatusQueryKey = (params?: FindPetsByStatus['queryParams']) => [{ url: '/pet/findByStatus' }, ...(params ? [params] : [])] as const
export type FindPetsByStatusQueryKey = ReturnType<typeof findPetsByStatusQueryKey>
export function findPetsByStatusQueryOptions<TData = FindPetsByStatus['response'], TQueryData = FindPetsByStatus['response']>(
  params?: FindPetsByStatus['queryParams'],
  options: FindPetsByStatus['client']['parameters'] = {},
): WithRequired<UseBaseQueryOptions<FindPetsByStatus['response'], FindPetsByStatus['error'], TData, TQueryData>, 'queryKey'> {
  const queryKey = findPetsByStatusQueryKey(params)
  return {
    queryKey,
    queryFn: async () => {
      const res = await client<FindPetsByStatus['data'], FindPetsByStatus['error']>({
        method: 'get',
        url: '/pet/findByStatus',
        params,
        ...options,
      })
      return res.data
    },
  }
}
/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * @link /pet/findByStatus
 */
export function useFindPetsByStatusHook<
  TData = FindPetsByStatus['response'],
  TQueryData = FindPetsByStatus['response'],
  TQueryKey extends QueryKey = FindPetsByStatusQueryKey,
>(
  params?: FindPetsByStatus['queryParams'],
  options: {
    query?: Partial<UseBaseQueryOptions<FindPetsByStatus['response'], FindPetsByStatus['error'], TData, TQueryData, TQueryKey>>
    client?: FindPetsByStatus['client']['parameters']
  } = {},
): UseQueryResult<TData, FindPetsByStatus['error']> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? findPetsByStatusQueryKey(params)
  const query = useQuery<FindPetsByStatus['data'], FindPetsByStatus['error'], TData, any>({
    ...findPetsByStatusQueryOptions<TData, TQueryData>(params, clientOptions),
    queryKey,
    ...queryOptions,
  }) as UseQueryResult<TData, FindPetsByStatus['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
export const findPetsByStatusInfiniteQueryKey = (params?: FindPetsByStatus['queryParams']) =>
  [{ url: '/pet/findByStatus' }, ...(params ? [params] : [])] as const
export type FindPetsByStatusInfiniteQueryKey = ReturnType<typeof findPetsByStatusInfiniteQueryKey>
export function findPetsByStatusInfiniteQueryOptions<TData = FindPetsByStatus['response'], TQueryData = FindPetsByStatus['response']>(
  params?: FindPetsByStatus['queryParams'],
  options: FindPetsByStatus['client']['parameters'] = {},
): WithRequired<UseInfiniteQueryOptions<FindPetsByStatus['response'], FindPetsByStatus['error'], TData, TQueryData>, 'queryKey'> {
  const queryKey = findPetsByStatusInfiniteQueryKey(params)
  return {
    queryKey,
    queryFn: async ({ pageParam }) => {
      const res = await client<FindPetsByStatus['data'], FindPetsByStatus['error']>({
        method: 'get',
        url: '/pet/findByStatus',
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
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * @link /pet/findByStatus
 */
export function useFindPetsByStatusHookInfinite<
  TData = InfiniteData<FindPetsByStatus['response']>,
  TQueryData = FindPetsByStatus['response'],
  TQueryKey extends QueryKey = FindPetsByStatusInfiniteQueryKey,
>(
  params?: FindPetsByStatus['queryParams'],
  options: {
    query?: Partial<UseInfiniteQueryOptions<FindPetsByStatus['response'], FindPetsByStatus['error'], TData, TQueryData, TQueryKey>>
    client?: FindPetsByStatus['client']['parameters']
  } = {},
): UseInfiniteQueryResult<TData, FindPetsByStatus['error']> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? findPetsByStatusInfiniteQueryKey(params)
  const query = useInfiniteQuery<FindPetsByStatus['data'], FindPetsByStatus['error'], TData, any>({
    ...findPetsByStatusInfiniteQueryOptions<TData, TQueryData>(params, clientOptions),
    queryKey,
    ...queryOptions,
  }) as UseInfiniteQueryResult<TData, FindPetsByStatus['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
