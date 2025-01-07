import client from '@kubb/plugin-client/clients/axios'
import type { FindPetsByStatusQueryResponse, FindPetsByStatusQueryParams, FindPetsByStatus400 } from '../../models/FindPetsByStatus.ts'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { QueryKey, QueryObserverOptions, UseQueryResult } from '@tanstack/react-query'
import { queryOptions, useQuery } from '@tanstack/react-query'

export const findPetsByStatusQueryKey = (params?: FindPetsByStatusQueryParams) => ['v5', { url: '/pet/findByStatus' }, ...(params ? [params] : [])] as const

export type FindPetsByStatusQueryKey = ReturnType<typeof findPetsByStatusQueryKey>

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * {@link /pet/findByStatus}
 */
async function findPetsByStatusHook(params?: FindPetsByStatusQueryParams, config: Partial<RequestConfig> = {}) {
  const res = await client<FindPetsByStatusQueryResponse, ResponseErrorConfig<FindPetsByStatus400>, unknown>({
    method: 'GET',
    url: '/pet/findByStatus',
    params,
    ...config,
  })
  return res.data
}

export function findPetsByStatusQueryOptionsHook(params?: FindPetsByStatusQueryParams, config: Partial<RequestConfig> = {}) {
  const queryKey = findPetsByStatusQueryKey(params)
  return queryOptions<FindPetsByStatusQueryResponse, ResponseErrorConfig<FindPetsByStatus400>, FindPetsByStatusQueryResponse, typeof queryKey>({
    queryKey,
    queryFn: async ({ signal }) => {
      config.signal = signal
      return findPetsByStatusHook(params, config)
    },
  })
}

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * {@link /pet/findByStatus}
 */
export function useFindPetsByStatusHook<
  TData = FindPetsByStatusQueryResponse,
  TQueryData = FindPetsByStatusQueryResponse,
  TQueryKey extends QueryKey = FindPetsByStatusQueryKey,
>(
  params?: FindPetsByStatusQueryParams,
  options: {
    query?: Partial<QueryObserverOptions<FindPetsByStatusQueryResponse, ResponseErrorConfig<FindPetsByStatus400>, TData, TQueryData, TQueryKey>>
    client?: Partial<RequestConfig>
  } = {},
) {
  const { query: queryOptions, client: config = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? findPetsByStatusQueryKey(params)

  const query = useQuery({
    ...(findPetsByStatusQueryOptionsHook(params, config) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, 'queryKey'>),
  }) as UseQueryResult<TData, ResponseErrorConfig<FindPetsByStatus400>> & { queryKey: TQueryKey }

  query.queryKey = queryKey as TQueryKey

  return query
}
