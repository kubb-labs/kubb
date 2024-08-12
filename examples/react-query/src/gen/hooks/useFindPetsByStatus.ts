import client from '@kubb/plugin-client/client'
import { useQuery, queryOptions } from '@tanstack/react-query'
import type { FindPetsByStatusQueryResponse, FindPetsByStatusQueryParams, FindPetsByStatus400 } from '../models/FindPetsByStatus'
import type { QueryKey, QueryObserverOptions, UseQueryResult } from '@tanstack/react-query'

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
export function useFindPetsByStatusQueryOptions(params?: FindPetsByStatus['queryParams'], options: FindPetsByStatus['client']['parameters'] = {}) {
  const queryKey = useFindPetsByStatusQueryKey(params)
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<FindPetsByStatus['data'], FindPetsByStatus['error']>({
        method: 'get',
        url: '/pet/findByStatus',
        ...options,
      })
      return res.data
    },
  })
}
export const useFindPetsByStatusQueryKey = (params?: FindPetsByStatus['queryParams']) =>
  ['v5', { url: '/pet/findByStatus' }, ...(params ? [params] : [])] as const
export type FindPetsByStatusQueryKey = ReturnType<typeof useFindPetsByStatusQueryKey>
/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * @link /pet/findByStatus
 */
export function useFindPetsByStatus<
  TData = FindPetsByStatus['response'],
  TQueryData = FindPetsByStatus['response'],
  TQueryKey extends QueryKey = FindPetsByStatusQueryKey,
>(
  params?: FindPetsByStatus['queryParams'],
  options: {
    query?: Partial<QueryObserverOptions<FindPetsByStatus['response'], FindPetsByStatus['error'], TData, TQueryData, TQueryKey>>
    client?: FindPetsByStatus['client']['parameters']
  } = {},
): UseQueryResult<TData, FindPetsByStatus['error']> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? useFindPetsByStatusQueryKey(params)
  const query = useQuery({
    ...(useFindPetsByStatusQueryOptions(params, clientOptions) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, 'queryKey'>),
  }) as UseQueryResult<TData, FindPetsByStatus['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
