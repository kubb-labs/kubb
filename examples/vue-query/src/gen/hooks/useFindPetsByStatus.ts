import client from '@kubb/plugin-client/client'
import type { FindPetsByStatusQueryResponse, FindPetsByStatusQueryParams, FindPetsByStatus400 } from '../models/FindPetsByStatus.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'
import type { QueryKey, QueryObserverOptions, UseQueryReturnType } from '@tanstack/vue-query'
import type { MaybeRef } from 'vue'
import { useQuery, queryOptions } from '@tanstack/vue-query'
import { unref } from 'vue'

export const findPetsByStatusQueryKey = (params?: MaybeRef<FindPetsByStatusQueryParams>) => [{ url: '/pet/findByStatus' }, ...(params ? [params] : [])] as const

export type FindPetsByStatusQueryKey = ReturnType<typeof findPetsByStatusQueryKey>

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * @link /pet/findByStatus
 */
async function findPetsByStatus(params?: FindPetsByStatusQueryParams, config: Partial<RequestConfig> = {}) {
  const res = await client<FindPetsByStatusQueryResponse, FindPetsByStatus400, unknown>({
    method: 'GET',
    url: '/pet/findByStatus',
    baseURL: 'https://petstore3.swagger.io/api/v3',
    params,
    ...config,
  })
  return res.data
}

export function findPetsByStatusQueryOptions(params?: MaybeRef<FindPetsByStatusQueryParams>, config: Partial<RequestConfig> = {}) {
  const queryKey = findPetsByStatusQueryKey(params)
  return queryOptions({
    queryKey,
    queryFn: async () => {
      return findPetsByStatus(unref(params), unref(config))
    },
  })
}

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * @link /pet/findByStatus
 */
export function useFindPetsByStatus<
  TData = FindPetsByStatusQueryResponse,
  TQueryData = FindPetsByStatusQueryResponse,
  TQueryKey extends QueryKey = FindPetsByStatusQueryKey,
>(
  params?: MaybeRef<FindPetsByStatusQueryParams>,
  options: {
    query?: Partial<QueryObserverOptions<FindPetsByStatusQueryResponse, FindPetsByStatus400, TData, TQueryData, TQueryKey>>
    client?: Partial<RequestConfig>
  } = {},
) {
  const { query: queryOptions, client: config = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? findPetsByStatusQueryKey(params)
  const query = useQuery({
    ...(findPetsByStatusQueryOptions(params, config) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, 'queryKey'>),
  }) as UseQueryReturnType<TData, FindPetsByStatus400> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
