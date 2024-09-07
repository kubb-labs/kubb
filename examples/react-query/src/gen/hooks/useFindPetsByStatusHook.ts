import client from '@kubb/plugin-client/client'
import type { FindPetsByStatusQueryResponse, FindPetsByStatusQueryParams, FindPetsByStatus400 } from '../models/FindPetsByStatus.ts'
import type { QueryKey, QueryObserverOptions, UseQueryResult } from '@tanstack/react-query'
import { useQuery, queryOptions } from '@tanstack/react-query'

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

export const findPetsByStatusQueryKey = (params?: FindPetsByStatus['queryParams']) => ['v5', { url: '/pet/findByStatus' }, ...(params ? [params] : [])] as const

export type FindPetsByStatusQueryKey = ReturnType<typeof findPetsByStatusQueryKey>

export function findPetsByStatusQueryOptions(params?: FindPetsByStatusQueryParams, options: Partial<Parameters<typeof client>[0]> = {}) {
  const queryKey = findPetsByStatusQueryKey(params)
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<FindPetsByStatus['data'], FindPetsByStatus['error']>({ method: 'get', url: '/pet/findByStatus', params, ...options })
      return res.data
    },
  })
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
  options?: {
    query?: Partial<QueryObserverOptions<FindPetsByStatus['response'], FindPetsByStatus['error'], TData, TQueryData, TQueryKey>>
    client?: FindPetsByStatus['client']['parameters']
  },
): UseQueryResult<TData, FindPetsByStatus['error']> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? findPetsByStatusQueryKey(params)
  const query = useQuery({
    ...(findPetsByStatusQueryOptions(params, clientOptions) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, 'queryKey'>),
  }) as UseQueryResult<TData, FindPetsByStatus['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
